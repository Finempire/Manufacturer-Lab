import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export async function POST(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole(["PRODUCTION_MANAGER", "SENIOR_MERCHANDISER"]);
    if (!auth.authorized) return auth.response;

    try {
        const techPack = await prisma.techPack.findUnique({ where: { id: params.id } });
        if (!techPack) {
            return NextResponse.json({ error: "Tech pack not found" }, { status: 404 });
        }

        if (techPack.status !== "BUYER_APPROVED") {
            return NextResponse.json(
                { error: `Cannot complete in status: ${techPack.status}. Must be BUYER_APPROVED.` },
                { status: 400 }
            );
        }

        const updated = await prisma.techPack.update({
            where: { id: params.id },
            data: {
                status: "COMPLETED",
                completed_at: new Date(),
            },
        });

        // Update order status
        await prisma.order.update({
            where: { id: techPack.order_id },
            data: { status: "TECH_PACK_COMPLETED" },
        });

        await createAuditLog({
            entityType: "TECHPACK",
            entityId: updated.id,
            action: "COMPLETED",
            performedBy: auth.user.id,
            newState: JSON.stringify({ status: "COMPLETED" }),
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Complete tech pack error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
