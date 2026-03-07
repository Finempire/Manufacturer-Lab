import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole(["PRODUCTION_MANAGER", "SAMPLE_PRODUCTION_MANAGER"]);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { notes } = body;

        const order = await prisma.order.findUnique({ where: { id: params.id } });
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.status !== "ORDER_RECEIVED" && order.status !== "PENDING_PM_ACCEPTANCE") {
            return NextResponse.json(
                { error: `Cannot accept order in status: ${order.status}` },
                { status: 400 }
            );
        }

        // Validate PM type matches order type
        const role = auth.user.role;
        if (role === "SAMPLE_PRODUCTION_MANAGER" && order.order_type !== "SAMPLE") {
            return NextResponse.json({ error: "Sample PM can only accept SAMPLE orders" }, { status: 403 });
        }
        if (role === "PRODUCTION_MANAGER" && order.order_type !== "PRODUCTION") {
            return NextResponse.json({ error: "Production PM can only accept PRODUCTION orders" }, { status: 403 });
        }

        const pmField = order.order_type === "SAMPLE"
            ? "assigned_sample_pm_id"
            : "assigned_production_pm_id";

        const updated = await prisma.order.update({
            where: { id: params.id },
            data: {
                status: "PENDING_PM_ACCEPTANCE",
                pm_accepted_at: new Date(),
                pm_accepted_by_id: auth.user.id,
                pm_acceptance_notes: notes || null,
                [pmField]: auth.user.id,
            },
        });

        await createAuditLog({
            entityType: "ORDER",
            entityId: updated.id,
            action: "PM_ACCEPTED",
            performedBy: auth.user.id,
            previousState: JSON.stringify({ status: order.status }),
            newState: JSON.stringify({ status: updated.status, pm_accepted_by: auth.user.id }),
        });

        // Notify accountant
        const accountants = await prisma.user.findMany({
            where: { role: "ACCOUNTANT", is_active: true },
        });
        if (accountants.length > 0) {
            await prisma.notification.createMany({
                data: accountants.map((acc) => ({
                    user_id: acc.id,
                    title: "Order Accepted by PM",
                    message: `Order ${order.order_no} accepted by PM.`,
                    entity_type: "ORDER",
                    entity_id: order.id,
                })),
            });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Accept order error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
