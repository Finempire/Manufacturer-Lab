import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const auth = await requireRole([
        "ACCOUNTANT",
        "SENIOR_MERCHANDISER",
        "PRODUCTION_MANAGER",
        "MERCHANDISER",
        "STORE_MANAGER",
        "RUNNER",
        "CEO",
    ]);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(req.url);

    // Return only the latest order (for auto-generating order numbers)
    if (searchParams.get("last") === "true") {
        const last = await prisma.order.findFirst({
            orderBy: { created_at: "desc" },
            select: { order_no: true },
        });
        return NextResponse.json(last || { order_no: null });
    }

    // RBAC-based filtering
    const role = auth.user.role;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (role === "SENIOR_MERCHANDISER") {
        where.order_type = "SAMPLE";
    } else if (role === "PRODUCTION_MANAGER") {
        where.order_type = "PRODUCTION";
    }
    // ACCOUNTANT, CEO, STORE_MANAGER, RUNNER see all orders

    const isFinancialRole = ["ACCOUNTANT", "CEO"].includes(role);

    const orders = await prisma.order.findMany({
        where,
        include: {
            buyer: true,
            creator: { select: { name: true } },
            lines: { include: { style: true } },
            ...(isFinancialRole ? { cost_summary: true } : {}),
        },
        orderBy: { created_at: "desc" },
    });

    // Strip financial fields for non-financial roles
    const financialRoles = ["ACCOUNTANT", "CEO"];
    if (!financialRoles.includes(role)) {
        const stripped = orders.map((order) => ({
            ...order,
            total_amount: undefined,
            lines: order.lines.map((line) => ({
                ...line,
                rate: undefined,
                amount: undefined,
            })),
        }));
        return NextResponse.json(stripped);
    }

    return NextResponse.json(orders);
}

export async function POST(req: Request) {
    const auth = await requireRole(["ACCOUNTANT"]);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const {
            buyer_id,
            order_date,
            shipping_date,
            order_type,
            remarks,
            lines,
            order_no: userOrderNo,
        } = body;

        if (!buyer_id || !order_date || !shipping_date || !order_type || !lines?.length) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const total_amount = lines.reduce(
            (sum: number, line: { amount: number }) => sum + line.amount,
            0
        );

        // Use user-provided order_no or auto-generate
        let order_no = userOrderNo;
        if (!order_no) {
            const lastOrder = await prisma.order.findFirst({
                orderBy: { created_at: "desc" },
            });
            const nextNum = lastOrder
                ? parseInt(lastOrder.order_no.split("-")[2]) + 1
                : 1;
            order_no = `ORD-${new Date().getFullYear()}-${String(nextNum).padStart(4, "0")}`;
        }

        const order = await prisma.order.create({
            data: {
                order_no,
                buyer_id,
                order_date: new Date(order_date),
                shipping_date: new Date(shipping_date),
                order_type,
                total_amount,
                remarks: remarks || null,
                created_by: auth.user.id,
                lines: {
                    create: lines.map(
                        (line: {
                            style_id: string;
                            description?: string;
                            quantity: number;
                            rate: number;
                            amount: number;
                        }) => ({
                            style_id: line.style_id,
                            description: line.description || null,
                            quantity: parseFloat(String(line.quantity)),
                            rate: parseFloat(String(line.rate)),
                            amount: parseFloat(String(line.amount)),
                        })
                    ),
                },
            },
        });

        await createAuditLog({
            entityType: "ORDER",
            entityId: order.id,
            action: "CREATED",
            performedBy: auth.user.id,
            newState: JSON.stringify({ order_no, total_amount }),
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error("Create order error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
