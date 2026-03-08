import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["PRODUCTION_MANAGER"]);
    if (!auth.authorized) return auth.response;

    const [newOrders, pendingTechPacks, materialRequirements, pendingExpenses] =
        await Promise.all([
            prisma.order.count({ where: { status: "ORDER_RECEIVED" } }),
            prisma.techPack.count({ where: { status: "SUBMITTED_FOR_REVIEW" } }),
            prisma.materialRequirement.count({
                where: { production_manager_id: auth.user.id },
            }),
            prisma.expenseRequest.count({
                where: { raised_by_id: auth.user.id, status: "PENDING_APPROVAL" },
            }),
        ]);

    return NextResponse.json({
        newOrders,
        pendingTechPacks,
        materialRequirements,
        pendingExpenses,
    });
}
