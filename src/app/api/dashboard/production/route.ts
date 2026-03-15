import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["PRODUCTION_MANAGER"]);
    if (!auth.authorized) return auth.response;

    const [
        newOrders,
        pendingTechPacks,
        materialRequirements,
        pendingExpenses,
        // V2 fields
        ordersByStage,
        techPacksAwaitingReview,
        materialPendingAcceptance,
        productionReadyOrders,
        delayedShippingRisk,
        blockedOrders,
    ] = await Promise.all([
        prisma.order.count({ where: { status: "ORDER_RECEIVED", order_type: "PRODUCTION" } }),
        prisma.techPack.count({ where: { status: "SUBMITTED_FOR_REVIEW" } }),
        prisma.materialRequirement.count({
            where: { production_manager_id: auth.user.id },
        }),
        prisma.expenseRequest.count({
            where: { raised_by_id: auth.user.id, status: "PENDING_APPROVAL" },
        }),
        // Orders by stage distribution (production orders only)
        prisma.order.groupBy({
            by: ["status"],
            where: { order_type: "PRODUCTION", status: { not: "COMPLETED" } },
            _count: { id: true },
        }),
        // Tech packs awaiting PM review
        prisma.techPack.count({
            where: {
                status: { in: ["SUBMITTED_FOR_REVIEW", "REVISION_SUBMITTED"] },
                order: { order_type: "PRODUCTION" },
            },
        }),
        // Material requirement pending store acceptance
        prisma.materialRequirement.count({
            where: {
                production_manager_id: auth.user.id,
                status: "PENDING_STORE_ACCEPTANCE",
            },
        }),
        // Production-ready orders (material completed, ready for production)
        prisma.order.count({
            where: {
                order_type: "PRODUCTION",
                status: "MATERIAL_COMPLETED",
            },
        }),
        // Delayed shipping risk
        prisma.order.count({
            where: {
                order_type: "PRODUCTION",
                status: { notIn: ["COMPLETED", "CANCELLED"] },
                exception_flags: { has: "DELAYED_SHIPPING_RISK" },
            },
        }),
        // Blocked orders
        prisma.order.count({
            where: {
                order_type: "PRODUCTION",
                status: { notIn: ["COMPLETED", "CANCELLED"] },
                blocker_code: { not: null },
            },
        }),
    ]);

    // Transform ordersByStage into a map
    const stageDistribution = ordersByStage.map((s) => ({
        stage: s.status,
        count: s._count.id,
    }));

    return NextResponse.json({
        newOrders,
        pendingTechPacks,
        materialRequirements,
        pendingExpenses,
        stageDistribution,
        techPacksAwaitingReview,
        materialPendingAcceptance,
        productionReadyOrders,
        delayedShippingRisk,
        blockedOrders,
    });
}
