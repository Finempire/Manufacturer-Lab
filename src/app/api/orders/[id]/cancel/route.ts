import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole(["ACCOUNTANT"]);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { reason } = body;

        const order = await prisma.order.findUnique({ where: { id: params.id } });
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.status === "COMPLETED" || order.status === "CANCELLED") {
            return NextResponse.json(
                { error: `Cannot cancel order in status: ${order.status}` },
                { status: 400 }
            );
        }

        const updated = await prisma.order.update({
            where: { id: params.id },
            data: {
                status: "CANCELLED",
                remarks: reason ? `${order.remarks || ""}\n[CANCELLED] ${reason}`.trim() : order.remarks,
            },
        });

        await createAuditLog({
            entityType: "ORDER",
            entityId: updated.id,
            action: "CANCELLED",
            performedBy: auth.user.id,
            previousState: JSON.stringify({ status: order.status }),
            newState: JSON.stringify({ status: "CANCELLED", reason }),
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Cancel order error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
