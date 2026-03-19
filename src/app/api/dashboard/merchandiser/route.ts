import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["MERCHANDISER"]);
    if (!auth.authorized) return auth.response;

    const userId = auth.user.id;

    const [
        totalOrders,
        pendingRequirements,
        myPurchases,
        myExpenses,
        myMaterialNeeds,
        myPendingExpenses,
        myActiveRequests,
    ] = await Promise.all([
        prisma.order.count(),
        prisma.materialRequirement.count({
            where: { production_manager_id: userId, status: "PENDING_STORE_ACCEPTANCE" },
        }),
        prisma.purchase.count({ where: { runner_id: userId } }),
        prisma.expenseRequest.count({ where: { raised_by_id: userId } }),
        prisma.materialRequirement.count({
            where: { production_manager_id: userId },
        }),
        prisma.expenseRequest.count({
            where: { raised_by_id: userId, status: "PENDING_APPROVAL" },
        }),
        prisma.materialRequest.count({
            where: { manager_id: userId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
        }),
    ]);

    return NextResponse.json({
        totalOrders,
        pendingRequirements,
        myPurchases,
        myExpenses,
        myMaterialNeeds,
        myPendingExpenses,
        myActiveRequests,
    });
}
