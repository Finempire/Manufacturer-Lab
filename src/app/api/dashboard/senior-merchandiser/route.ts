import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["SENIOR_MERCHANDISER"]);
    if (!auth.authorized) return auth.response;

    const userId = auth.user.id;

    const [activeOrders, pendingRequests, materialPending, myPurchases, pendingExpenses] =
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
                    status: "ORDER_RECEIVED",
                },
            }),
            prisma.materialRequirement.count({
                where: {
                    production_manager_id: userId,
                    status: { in: ["PENDING_STORE_ACCEPTANCE", "ACCEPTED_BY_STORE"] },
                },
            }),
            prisma.purchase.count({ where: { runner_id: userId } }),
            prisma.expenseRequest.count({
                where: {
                    raised_by_id: userId,
                    status: "PENDING_APPROVAL",
                },
            }),
        ]);

    return NextResponse.json({
        activeOrders,
        pendingRequests,
        materialPending,
        myPurchases,
        pendingExpenses,
    });
}
