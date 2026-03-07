import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole(["STORE_MANAGER"]);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { reason } = body;

        const requirement = await prisma.materialRequirement.findUnique({ where: { id: params.id } });
        if (!requirement) {
            return NextResponse.json({ error: "Material requirement not found" }, { status: 404 });
        }

        if (requirement.status !== "PENDING_STORE_ACCEPTANCE") {
            return NextResponse.json(
                { error: `Cannot decline in status: ${requirement.status}` },
                { status: 400 }
            );
        }

        const updated = await prisma.materialRequirement.update({
            where: { id: params.id },
            data: {
                status: "DECLINED_BY_STORE",
                store_manager_id: auth.user.id,
                decline_reason: reason || null,
            },
        });

        await createAuditLog({
            entityType: "MATERIAL_REQUIREMENT",
            entityId: updated.id,
            action: "DECLINED_BY_STORE",
            performedBy: auth.user.id,
            newState: JSON.stringify({ status: "DECLINED_BY_STORE", reason }),
        });

        // Notify PM
        await prisma.notification.create({
            data: {
                user_id: requirement.production_manager_id,
                title: "Material Requirement Declined",
                message: `Your material requirement has been declined.${reason ? ` Reason: ${reason}` : ""}`,
                entity_type: "MATERIAL_REQUIREMENT",
                entity_id: requirement.id,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Decline material requirement error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
