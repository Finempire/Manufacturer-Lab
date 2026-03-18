import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole(["PRODUCTION_MANAGER", "SENIOR_MERCHANDISER", "ACCOUNTANT"]);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { merchandiser_id } = body;

        if (!merchandiser_id) {
            return NextResponse.json({ error: "merchandiser_id is required" }, { status: 400 });
        }

        const order = await prisma.order.findUnique({ where: { id: params.id } });
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Verify merchandiser exists and has MERCHANDISER role
        const merchandiser = await prisma.user.findUnique({ where: { id: merchandiser_id } });
        if (!merchandiser || merchandiser.role !== "MERCHANDISER") {
            return NextResponse.json({ error: "Invalid merchandiser" }, { status: 400 });
        }

        const updated = await prisma.order.update({
            where: { id: params.id },
            data: {
                assigned_merchandiser_id: merchandiser_id,
                status: "MERCHANDISER_ASSIGNED",
            },
        });

        await createAuditLog({
            entityType: "ORDER",
            entityId: updated.id,
            action: "MERCHANDISER_ASSIGNED",
            performedBy: auth.user.id,
            previousState: JSON.stringify({ status: order.status, merchandiser: order.assigned_merchandiser_id }),
            newState: JSON.stringify({ status: updated.status, merchandiser: merchandiser_id }),
        });

        // Notify merchandiser
        await prisma.notification.create({
            data: {
                user_id: merchandiser_id,
                title: "New Order Assigned",
                message: `You have been assigned to order ${order.order_no}.`,
                entity_type: "ORDER",
                entity_id: order.id,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Assign merchandiser error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
