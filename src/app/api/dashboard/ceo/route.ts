import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["CEO"]);
    if (!auth.authorized) return auth.response;

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
        totalOrders,
        activeOrders,
        totalPaid,
        totalExpenses,
        ordersByStage,
        buyerSummary,
        delayedOrders,
        pendingSignoff,
        expenseTrend,
        procurementTrend,
        exceptionCount,
    ] = await Promise.all([
        // Existing KPIs
        prisma.order.count(),
        prisma.order.count({
            where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
        }),
        prisma.payment.aggregate({ _sum: { amount_paid: true } }),
        prisma.expenseRequest.aggregate({
            _sum: { actual_amount: true },
            where: { status: "PAID" },
        }),

        // Orders by stage
        prisma.order.groupBy({
            by: ["status"],
            _count: { _all: true },
        }),

        // Buyer summary: top buyers by active order count
        prisma.$queryRaw<
            {
                buyer_id: string;
                buyer_name: string;
                active_orders: bigint;
                total_orders: bigint;
                total_paid: number | null;
            }[]
        >`
            SELECT
                b.id AS buyer_id,
                b.name AS buyer_name,
                COUNT(CASE WHEN o.status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 END) AS active_orders,
                COUNT(o.id) AS total_orders,
                COALESCE(SUM(p.total_paid), 0) AS total_paid
            FROM "Buyer" b
            LEFT JOIN "Order" o ON o.buyer_id = b.id
            LEFT JOIN (
                SELECT mr.buyer_id, SUM(pay.amount_paid) AS total_paid
                FROM "MaterialRequest" mr
                JOIN "Purchase" pu ON pu.request_id = mr.id
                JOIN "Payment" pay ON pay.purchase_id = pu.id
                GROUP BY mr.buyer_id
            ) p ON p.buyer_id = b.id
            GROUP BY b.id, b.name
            HAVING COUNT(o.id) > 0
            ORDER BY COUNT(CASE WHEN o.status NOT IN ('COMPLETED', 'CANCELLED') THEN 1 END) DESC
            LIMIT 10
        `,

        // Delayed orders
        prisma.order.findMany({
            where: {
                shipping_date: { lt: now },
                status: { notIn: ["COMPLETED", "CANCELLED"] },
            },
            select: {
                id: true,
                order_no: true,
                status: true,
                shipping_date: true,
                buyer: { select: { name: true } },
            },
            orderBy: { shipping_date: "asc" },
            take: 20,
        }),

        // Pending sign-off
        prisma.order.count({
            where: { status: "PAID" },
        }),

        // Expense trend (last 6 months)
        prisma.$queryRaw<{ month: string; amount: number }[]>`
            SELECT
                to_char(date_trunc('month', expense_date), 'YYYY-MM') AS month,
                COALESCE(SUM(actual_amount), 0) AS amount
            FROM "ExpenseRequest"
            WHERE status IN ('PAID', 'COMPLETED')
              AND expense_date >= ${sixMonthsAgo}
            GROUP BY date_trunc('month', expense_date)
            ORDER BY date_trunc('month', expense_date)
        `,

        // Procurement trend (last 6 months)
        prisma.$queryRaw<{ month: string; amount: number }[]>`
            SELECT
                to_char(date_trunc('month', invoice_date), 'YYYY-MM') AS month,
                COALESCE(SUM(invoice_amount), 0) AS amount
            FROM "Purchase"
            WHERE status NOT IN ('REJECTED', 'CANCELLED')
              AND invoice_date >= ${sixMonthsAgo}
            GROUP BY date_trunc('month', invoice_date)
            ORDER BY date_trunc('month', invoice_date)
        `,

        // Exception count
        prisma.order.count({
            where: {
                OR: [
                    { overdue_flag: true },
                    { blocker_code: { not: null } },
                ],
            },
        }),
    ]);

    // Format orders by stage
    const ordersByStageFormatted = ordersByStage.map((g) => ({
        stage: g.status,
        count: g._count._all,
    }));

    // Format delayed orders with days_delayed
    const delayedOrdersFormatted = delayedOrders.map((o) => {
        const daysDelayed = Math.ceil(
            (now.getTime() - new Date(o.shipping_date).getTime()) /
                (1000 * 60 * 60 * 24)
        );
        return {
            id: o.id,
            order_no: o.order_no,
            buyer: o.buyer.name,
            stage: o.status,
            shipping_date: o.shipping_date,
            days_delayed: daysDelayed,
        };
    });

    // Format buyer summary (convert bigints to numbers)
    const buyerSummaryFormatted = buyerSummary.map((b) => ({
        buyer_name: b.buyer_name,
        active_orders: Number(b.active_orders),
        total_orders: Number(b.total_orders),
        total_paid: Number(b.total_paid) || 0,
    }));

    // Format trends - ensure numbers
    const expenseTrendFormatted = expenseTrend.map((t) => ({
        month: t.month,
        amount: Number(t.amount) || 0,
    }));
    const procurementTrendFormatted = procurementTrend.map((t) => ({
        month: t.month,
        amount: Number(t.amount) || 0,
    }));

    return NextResponse.json({
        totalOrders,
        activeOrders,
        totalPaid: totalPaid._sum.amount_paid || 0,
        totalExpenses: totalExpenses._sum.actual_amount || 0,
        ordersByStage: ordersByStageFormatted,
        buyerSummary: buyerSummaryFormatted,
        delayedOrders: delayedOrdersFormatted,
        pendingSignoff,
        expenseTrend: expenseTrendFormatted,
        procurementTrend: procurementTrendFormatted,
        exceptionCount,
    });
}
