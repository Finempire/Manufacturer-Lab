import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/auditLog";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole(["MERCHANDISER"]);
    if (!auth.authorized) return auth.response;

    try {
        const body = await req.json();
        const { document_path, notes } = body;

        const techPack = await prisma.techPack.findUnique({ where: { id: params.id } });
        if (!techPack) {
            return NextResponse.json({ error: "Tech pack not found" }, { status: 404 });
        }

        if (techPack.merchandiser_id !== auth.user.id) {
            return NextResponse.json({ error: "Forbidden: Not assigned to you" }, { status: 403 });
        }

        const allowedStatuses = ["MERCH_ACCEPTED", "IN_PROGRESS", "REVISION_IN_PROGRESS"];
        if (!allowedStatuses.includes(techPack.status)) {
            return NextResponse.json(
                { error: `Cannot submit in status: ${techPack.status}` },
                { status: 400 }
            );
        }

        const isRevision = techPack.status === "REVISION_IN_PROGRESS";
        const newRevisionNumber = techPack.revision_count + 1;

        const updated = await prisma.$transaction(async (tx) => {
            // Create revision record
            await tx.techPackRevision.create({
                data: {
                    tech_pack_id: params.id,
                    revision_number: newRevisionNumber,
                    document_path: document_path || "",
                    pm_notes: notes || null,
                    status: "SUBMITTED",
                    submitted_by_id: auth.user.id,
                    submitted_at: new Date(),
                },
            });

            // Update tech pack
            const result = await tx.techPack.update({
                where: { id: params.id },
                data: {
                    status: isRevision ? "REVISION_SUBMITTED" : "SUBMITTED_FOR_REVIEW",
                    submitted_for_review_at: new Date(),
                    revision_count: newRevisionNumber,
                },
            });

            return result;
        });

        await createAuditLog({
            entityType: "TECHPACK",
            entityId: updated.id,
            action: isRevision ? "REVISION_SUBMITTED" : "SUBMITTED_FOR_REVIEW",
            performedBy: auth.user.id,
            newState: JSON.stringify({ revision: newRevisionNumber }),
        });

        // Notify PMs
        const pms = await prisma.user.findMany({
            where: {
                role: { in: ["PRODUCTION_MANAGER", "SAMPLE_PRODUCTION_MANAGER"] },
                is_active: true,
            },
        });
        if (pms.length > 0) {
            await prisma.notification.createMany({
                data: pms.map((pm) => ({
                    user_id: pm.id,
                    title: "Tech Pack Submitted for Review",
                    message: `Tech Pack ${techPack.tech_pack_no} submitted for review (revision ${newRevisionNumber}).`,
                    entity_type: "TECHPACK",
                    entity_id: techPack.id,
                })),
            });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Submit tech pack error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
