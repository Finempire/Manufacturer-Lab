import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["CEO"]);
    if (!auth.authorized) return auth.response;

    const [totalOrders, activeOrders, totalPaid, totalExpenses] =
        await Promise.all([
            prisma.order.count(),
            prisma.order.count({ where: { status: { not: "COMPLETED" } } }),
            prisma.payment.aggregate({ _sum: { amount_paid: true } }),
            prisma.expenseRequest.aggregate({
                _sum: { actual_amount: true },
                where: { status: "PAID" },
            }),
        ]);

    return NextResponse.json({
        totalOrders,
        activeOrders,
        totalPaid: totalPaid._sum.amount_paid || 0,
        totalExpenses: totalExpenses._sum.actual_amount || 0,
    });
}
