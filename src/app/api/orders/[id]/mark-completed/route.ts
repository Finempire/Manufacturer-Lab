import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export async function POST(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole(["ACCOUNTANT"]);
    if (!auth.authorized) return auth.response;

    try {
        const order = await prisma.order.findUnique({ where: { id: params.id } });
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.status !== "PAID") {
            return NextResponse.json(
                { error: `Cannot mark completed. Current status: ${order.status}. Must be PAID.` },
                { status: 400 }
            );
        }

        const updated = await prisma.order.update({
            where: { id: params.id },
            data: { status: "COMPLETED" },
        });

        await createAuditLog({
            entityType: "ORDER",
            entityId: updated.id,
            action: "COMPLETED",
            performedBy: auth.user.id,
            previousState: JSON.stringify({ status: order.status }),
            newState: JSON.stringify({ status: "COMPLETED" }),
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Mark completed error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
