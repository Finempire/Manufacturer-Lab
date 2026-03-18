import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const auth = await requireRole([
        "ACCOUNTANT",
        "PRODUCTION_MANAGER",
        "SENIOR_MERCHANDISER",
        "MERCHANDISER",
        "STORE_MANAGER",
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
    if (role === "PRODUCTION_MANAGER" || role === "SENIOR_MERCHANDISER" || role === "MERCHANDISER") {
        where.production_manager_id = auth.user.id;
    } else if (role === "STORE_MANAGER") {
        // SM sees requirements assigned to them or pending acceptance
        where.OR = [
            { store_manager_id: auth.user.id },
            { status: "PENDING_STORE_ACCEPTANCE" },
        ];
    }

    const requirements = await prisma.materialRequirement.findMany({
        where,
        include: {
            order: { select: { order_no: true, order_type: true } },
            buyer: { select: { name: true } },
            style: { select: { style_code: true, style_name: true } },
            production_manager: { select: { name: true } },
            store_manager: { select: { name: true } },
            lines: true,
        },
        orderBy: { created_at: "desc" },
    });

    return NextResponse.json(requirements);
}

export async function POST(req: Request) {
    const auth = await requireRole(["PRODUCTION_MANAGER", "SENIOR_MERCHANDISER", "MERCHANDISER"]);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { order_id, buyer_id, style_id, required_by_date, special_instructions, lines } = body;

        if (!order_id || !buyer_id || !style_id || !required_by_date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const requirement = await prisma.materialRequirement.create({
            data: {
                order_id,
                buyer_id,
                style_id,
                production_manager_id: auth.user.id,
                required_by_date: new Date(required_by_date),
                special_instructions: special_instructions || null,
                status: "PENDING_STORE_ACCEPTANCE",
                lines: lines?.length
                    ? {
                          create: lines.map(
                              (line: {
                                  material_name: string;
                                  description?: string;
                                  quantity: number;
                                  unit: string;
                              }) => ({
                                  material_name: line.material_name,
                                  description: line.description || null,
                                  quantity: parseFloat(String(line.quantity)),
                                  unit: line.unit,
                              })
                          ),
                      }
                    : undefined,
            },
        });

        // Update order status
        await prisma.order.update({
            where: { id: order_id },
            data: { status: "MATERIAL_REQUIREMENT_SENT" },
        });

        await createAuditLog({
            entityType: "MATERIAL_REQUIREMENT",
            entityId: requirement.id,
            action: "CREATED",
            performedBy: auth.user.id,
            newState: JSON.stringify({ order_id, style_id }),
        });

        // Notify store managers
        const storeManagers = await prisma.user.findMany({
            where: { role: "STORE_MANAGER", is_active: true },
        });
        if (storeManagers.length > 0) {
            await prisma.notification.createMany({
                data: storeManagers.map((sm) => ({
                    user_id: sm.id,
                    title: "New Material Requirement",
                    message: `New material requirement raised for order. Please review and accept.`,
                    entity_type: "MATERIAL_REQUIREMENT",
                    entity_id: requirement.id,
                })),
            });
        }

        return NextResponse.json(requirement, { status: 201 });
    } catch (error) {
        console.error("Create material requirement error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
