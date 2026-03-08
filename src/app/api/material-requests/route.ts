import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const auth = await requireRole([
        "ACCOUNTANT",
        "STORE_MANAGER",
        "RUNNER",
        "PRODUCTION_MANAGER",
        "SAMPLE_PRODUCTION_MANAGER",
        "CEO",
    ]);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (orderId) where.order_id = orderId;
    if (status) where.status = status;

    const role = auth.user.role;
    if (role === "STORE_MANAGER") {
        where.manager_id = auth.user.id;
    } else if (role === "RUNNER") {
        where.assigned_runner_id = auth.user.id;
    }

    const requests = await prisma.materialRequest.findMany({
        where,
        include: {
            manager: { select: { name: true } },
            buyer: { select: { name: true } },
            order: { select: { order_no: true } },
            style: { select: { style_code: true, style_name: true } },
            runner: { select: { id: true, name: true } },
            preferred_vendor: { select: { name: true } },
            lines: { include: { material: true } },
        },
        orderBy: { created_at: "desc" },
    });

    return NextResponse.json(requests);
}

export async function POST(req: Request) {
    const auth = await requireRole(["STORE_MANAGER"]);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const {
            buyer_id,
            order_id,
            style_id,
            material_requirement_id,
            store_location,
            expected_date,
            remarks,
            preferred_vendor_id,
            assigned_runner_id,
            lines,
        } = body;

        if (!buyer_id || !order_id || !assigned_runner_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Runner lock check
        const runner = await prisma.user.findUnique({ where: { id: assigned_runner_id } });
        if (!runner || runner.role !== "RUNNER") {
            return NextResponse.json({ error: "Invalid runner" }, { status: 400 });
        }
        if (runner.runner_status !== "AVAILABLE") {
            return NextResponse.json(
                { error: "Runner is currently on a task. Please select another runner or wait." },
                { status: 409 }
            );
        }

        // Generate request number
        const year = new Date().getFullYear();
        const lastReq = await prisma.materialRequest.findFirst({
            where: { request_no: { startsWith: `MR-${year}-` } },
            orderBy: { created_at: "desc" },
        });
        let nextNum = 1;
        if (lastReq) {
            const parsed = parseInt(lastReq.request_no.split("-")[2]);
            if (!isNaN(parsed)) nextNum = parsed + 1;
        }
        const request_no = `MR-${year}-${String(nextNum).padStart(4, "0")}`;

        const result = await prisma.$transaction(async (tx) => {
            // Create request
            const materialRequest = await tx.materialRequest.create({
                data: {
                    request_no,
                    manager_id: auth.user.id,
                    buyer_id,
                    order_id,
                    style_id: style_id || null,
                    material_requirement_id: material_requirement_id || null,
                    store_location: store_location || null,
                    expected_date: expected_date ? new Date(expected_date) : null,
                    remarks: remarks || null,
                    preferred_vendor_id: preferred_vendor_id || null,
                    assigned_runner_id,
                    status: "PENDING_PURCHASE",
                    lines: lines?.length
                        ? {
                              create: lines.map(
                                  (line: {
                                      material_id: string;
                                      style_id?: string;
                                      description?: string;
                                      quantity: number;
                                      expected_rate: number;
                                      expected_amount: number;
                                  }) => ({
                                      material_id: line.material_id,
                                      style_id: line.style_id || null,
                                      description: line.description || null,
                                      quantity: parseFloat(String(line.quantity)),
                                      expected_rate: parseFloat(String(line.expected_rate)),
                                      expected_amount: parseFloat(String(line.expected_amount)),
                                  })
                              ),
                          }
                        : undefined,
                },
            });

            // Lock runner
            await tx.user.update({
                where: { id: assigned_runner_id },
                data: {
                    runner_status: "ON_TASK",
                    current_task_id: materialRequest.id,
                },
            });

            // Update material requirement status if linked
            if (material_requirement_id) {
                await tx.materialRequirement.update({
                    where: { id: material_requirement_id },
                    data: { status: "REQUEST_RAISED" },
                });
            }

            // Update order status
            await tx.order.update({
                where: { id: order_id },
                data: { status: "MATERIAL_IN_PROGRESS" },
            });

            return materialRequest;
        });

        await createAuditLog({
            entityType: "MATERIAL_REQUEST",
            entityId: result.id,
            action: "CREATED",
            performedBy: auth.user.id,
            newState: JSON.stringify({ request_no, assigned_runner_id }),
        });

        // Notify runner
        await prisma.notification.create({
            data: {
                user_id: assigned_runner_id,
                title: "New Purchase Request",
                message: `You have been assigned purchase request ${request_no}.`,
                entity_type: "MATERIAL_REQUEST",
                entity_id: result.id,
            },
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Create material request error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
