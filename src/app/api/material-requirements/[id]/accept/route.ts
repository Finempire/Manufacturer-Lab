import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export async function POST(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole(["STORE_MANAGER", "PRODUCTION_MANAGER", "SENIOR_MERCHANDISER", "MERCHANDISER", "ACCOUNTANT", "CEO"]);
    if (!auth.authorized) return auth.response;

    try {
        const requirement = await prisma.materialRequirement.findUnique({ where: { id: params.id } });
        if (!requirement) {
            return NextResponse.json({ error: "Material requirement not found" }, { status: 404 });
        }

        if (requirement.status !== "PENDING_STORE_ACCEPTANCE") {
            return NextResponse.json(
                { error: `Cannot accept in status: ${requirement.status}` },
                { status: 400 }
            );
        }

        const updated = await prisma.materialRequirement.update({
            where: { id: params.id },
            data: {
                status: "ACCEPTED_BY_STORE",
                store_manager_id: auth.user.id,
            },
        });

        await createAuditLog({
            entityType: "MATERIAL_REQUIREMENT",
            entityId: updated.id,
            action: "ACCEPTED_BY_STORE",
            performedBy: auth.user.id,
            newState: JSON.stringify({ status: "ACCEPTED_BY_STORE" }),
        });

        // Notify PM
        await prisma.notification.create({
            data: {
                user_id: requirement.production_manager_id,
                title: "Material Requirement Accepted",
                message: `Your material requirement has been accepted by the Store Manager.`,
                entity_type: "MATERIAL_REQUIREMENT",
                entity_id: requirement.id,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Accept material requirement error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
