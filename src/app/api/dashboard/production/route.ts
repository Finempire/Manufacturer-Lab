import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["PRODUCTION_MANAGER"]);
    if (!auth.authorized) return auth.response;

    const userId = auth.user.id;

    const [
        newOrders,
        materialRequirements,
        pendingExpenses,
        ordersByStage,
        materialPendingAcceptance,
        myPurchases,
        blockedOrders,
    ] = await Promise.all([
        prisma.order.count({ where: { status: "ORDER_RECEIVED", order_type: "PRODUCTION" } }),
        prisma.materialRequirement.count({
            where: { production_manager_id: userId },
        }),
        prisma.expenseRequest.count({
            where: { raised_by_id: userId, status: "PENDING_APPROVAL" },
        }),
        prisma.order.groupBy({
            by: ["status"],
            where: { order_type: "PRODUCTION", status: { not: "COMPLETED" } },
            _count: { id: true },
        }),
        prisma.materialRequirement.count({
            where: {
                production_manager_id: userId,
                status: "PENDING_STORE_ACCEPTANCE",
            },
        }),
        prisma.purchase.count({ where: { runner_id: userId } }),
        prisma.order.count({
            where: {
                order_type: "PRODUCTION",
                status: { notIn: ["COMPLETED", "CANCELLED"] },
                blocker_code: { not: null },
            },
        }),
    ]);

    const stageDistribution = ordersByStage.map((s) => ({
        stage: s.status,
        count: s._count.id,
    }));

    return NextResponse.json({
        newOrders,
        materialRequirements,
        pendingExpenses,
        stageDistribution,
        materialPendingAcceptance,
        myPurchases,
        blockedOrders,
    });
}
