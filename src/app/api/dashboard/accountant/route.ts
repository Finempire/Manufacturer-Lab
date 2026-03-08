import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["ACCOUNTANT"]);
    if (!auth.authorized) return auth.response;

    const [
        pendingPurchases,
        pendingPayments,
        activeOrders,
        pendingExpenses,
        todayPayments,
        totalUsers,
    ] = await Promise.all([
        prisma.purchase.count({ where: { status: "INVOICE_SUBMITTED" } }),
        prisma.purchase.count({ where: { status: { in: ["APPROVED", "PARTIALLY_PAID"] } } }),
        prisma.order.count({ where: { status: { not: "COMPLETED" } } }),
        prisma.expenseRequest.count({ where: { status: "PENDING_APPROVAL" } }),
        prisma.payment.aggregate({
            _sum: { amount_paid: true },
            where: {
                payment_date: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
            },
        }),
        prisma.user.count({ where: { is_active: true } }),
    ]);

    return NextResponse.json({
        pendingPurchases,
        pendingPayments,
        activeOrders,
        pendingExpenses,
        todayPaid: todayPayments._sum.amount_paid || 0,
        totalUsers,
    });
}
