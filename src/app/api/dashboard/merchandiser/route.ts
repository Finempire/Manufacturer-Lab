import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["MERCHANDISER"]);
    if (!auth.authorized) return auth.response;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
        assignedOrders,
        draftTechPacks,
        completedTechPacks,
        // V2 fields
        assignedTechPacks,
        submittedAwaitingReview,
        revisionRequired,
        completedThisWeek,
    ] = await Promise.all([
        prisma.order.count({ where: { assigned_merchandiser_id: auth.user.id } }),
        prisma.techPack.count({ where: { merchandiser_id: auth.user.id, status: "IN_PROGRESS" } }),
        prisma.techPack.count({ where: { merchandiser_id: auth.user.id, status: "BUYER_APPROVED" } }),
        // All tech packs assigned to this merchandiser (any active status)
        prisma.techPack.count({
            where: {
                merchandiser_id: auth.user.id,
                status: { notIn: ["BUYER_APPROVED", "COMPLETED"] },
            },
        }),
        // Submitted and awaiting PM review
        prisma.techPack.count({
            where: {
                merchandiser_id: auth.user.id,
                status: { in: ["SUBMITTED_FOR_REVIEW", "REVISION_SUBMITTED"] },
            },
        }),
        // Revision required (buyer rejected or revision in progress)
        prisma.techPack.count({
            where: {
                merchandiser_id: auth.user.id,
                status: { in: ["BUYER_REJECTED", "REVISION_IN_PROGRESS"] },
            },
        }),
        // Completed this week
        prisma.techPack.count({
            where: {
                merchandiser_id: auth.user.id,
                status: { in: ["BUYER_APPROVED", "COMPLETED"] },
                updated_at: { gte: weekAgo },
            },
        }),
    ]);

    return NextResponse.json({
        assignedOrders,
        draftTechPacks,
        completedTechPacks,
        assignedTechPacks,
        submittedAwaitingReview,
        revisionRequired,
        completedThisWeek,
    });
}
