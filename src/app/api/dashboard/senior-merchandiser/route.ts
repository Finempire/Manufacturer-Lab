import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["SENIOR_MERCHANDISER"]);
    if (!auth.authorized) return auth.response;

    const [activeOrders, pendingAcceptance, techPacksInProgress, materialPending, inProduction, pendingExpenses] =
        await Promise.all([
            prisma.order.count({
                where: {
                    order_type: "SAMPLE",
                    status: { notIn: ["COMPLETED", "CANCELLED"] },
                },
            }),
            prisma.order.count({
                where: {
                    order_type: "SAMPLE",
                    status: "PENDING_PM_ACCEPTANCE",
                },
            }),
            prisma.techPack.count({
                where: {
                    status: { in: ["IN_PROGRESS", "SUBMITTED_FOR_REVIEW", "PM_REVIEWING", "REVISION_IN_PROGRESS"] },
                    order: { order_type: "SAMPLE" },
                },
            }),
            prisma.materialRequirement.count({
                where: {
                    production_manager_id: auth.user.id,
                    status: { in: ["PENDING_STORE_ACCEPTANCE", "ACCEPTED_BY_STORE"] },
                },
            }),
            prisma.order.count({
                where: {
                    order_type: "SAMPLE",
                    status: { in: ["PRODUCTION_ACCEPTED", "UNDER_PRODUCTION"] },
                },
            }),
            prisma.expenseRequest.count({
                where: {
                    raised_by_id: auth.user.id,
                    status: "PENDING_APPROVAL",
                },
            }),
        ]);

    return NextResponse.json({
        activeOrders,
        pendingAcceptance,
        techPacksInProgress,
        materialPending,
        inProduction,
        pendingExpenses,
    });
}
