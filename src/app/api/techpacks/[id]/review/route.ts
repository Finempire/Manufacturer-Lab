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
        const { decision, notes } = body;
        // decision: "approve" | "reject" | "share_with_buyer"

        if (!decision || !["approve", "reject", "share_with_buyer"].includes(decision)) {
            return NextResponse.json(
                { error: "decision must be one of: approve, reject, share_with_buyer" },
                { status: 400 }
            );
        }

        const techPack = await prisma.techPack.findUnique({
            where: { id: params.id },
            include: { revisions: { orderBy: { revision_number: "desc" }, take: 1 } },
        });
        if (!techPack) {
            return NextResponse.json({ error: "Tech pack not found" }, { status: 404 });
        }

        const reviewableStatuses = ["SUBMITTED_FOR_REVIEW", "REVISION_SUBMITTED", "PM_REVIEWING"];
        if (!reviewableStatuses.includes(techPack.status)) {
            return NextResponse.json(
                { error: `Cannot review in status: ${techPack.status}` },
                { status: 400 }
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {
            pm_reviewed_at: new Date(),
        };

        let action = "";

        if (decision === "approve") {
            updateData.status = "BUYER_APPROVED";
            action = "PM_APPROVED";
        } else if (decision === "reject") {
            updateData.status = "REVISION_IN_PROGRESS";
            updateData.pm_rejection_notes = notes || null;
            action = "PM_REJECTED";
        } else if (decision === "share_with_buyer") {
            updateData.status = "SHARED_WITH_BUYER";
            updateData.shared_with_buyer_at = new Date();
            action = "SHARED_WITH_BUYER";
        }

        const updated = await prisma.$transaction(async (tx) => {
            // Update latest revision
            const latestRevision = techPack.revisions[0];
            if (latestRevision) {
                await tx.techPackRevision.update({
                    where: { id: latestRevision.id },
                    data: {
                        status: decision === "approve" ? "APPROVED" : decision === "reject" ? "REJECTED" : "SUBMITTED",
                        reviewed_by_id: auth.user.id,
                        reviewed_at: new Date(),
                        pm_notes: notes || null,
                    },
                });
            }

            return tx.techPack.update({
                where: { id: params.id },
                data: updateData,
            });
        });

        await createAuditLog({
            entityType: "TECHPACK",
            entityId: updated.id,
            action,
            performedBy: auth.user.id,
            newState: JSON.stringify({ decision, notes }),
        });

        // Notify merchandiser
        if (techPack.merchandiser_id) {
            await prisma.notification.create({
                data: {
                    user_id: techPack.merchandiser_id,
                    title: `Tech Pack ${decision === "approve" ? "Approved" : decision === "reject" ? "Rejected" : "Shared with Buyer"}`,
                    message: `Tech Pack ${techPack.tech_pack_no} has been ${decision === "approve" ? "approved" : decision === "reject" ? "rejected - revision needed" : "shared with buyer"}.${notes ? ` Notes: ${notes}` : ""}`,
                    entity_type: "TECHPACK",
                    entity_id: techPack.id,
                },
            });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Review tech pack error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
