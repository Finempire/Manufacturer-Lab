import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export async function POST(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole(["MERCHANDISER"]);
    if (!auth.authorized) return auth.response;

    try {
        const techPack = await prisma.techPack.findUnique({ where: { id: params.id } });
        if (!techPack) {
            return NextResponse.json({ error: "Tech pack not found" }, { status: 404 });
        }

        if (techPack.merchandiser_id !== auth.user.id) {
            return NextResponse.json({ error: "Forbidden: Not assigned to you" }, { status: 403 });
        }

        if (techPack.status !== "PENDING_MERCH_ACCEPTANCE") {
            return NextResponse.json(
                { error: `Cannot accept in status: ${techPack.status}` },
                { status: 400 }
            );
        }

        const updated = await prisma.techPack.update({
            where: { id: params.id },
            data: {
                status: "MERCH_ACCEPTED",
                merch_accepted_at: new Date(),
            },
        });

        // Update order status
        await prisma.order.update({
            where: { id: techPack.order_id },
            data: { status: "TECH_PACK_IN_PROGRESS" },
        });

        await createAuditLog({
            entityType: "TECHPACK",
            entityId: updated.id,
            action: "MERCH_ACCEPTED",
            performedBy: auth.user.id,
            newState: JSON.stringify({ status: "MERCH_ACCEPTED" }),
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Accept tech pack error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
