import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { recalculateOrderCost } from "@/lib/costTracker";

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const auth = await requireRole([
        "ACCOUNTANT", "CEO", "PRODUCTION_MANAGER", "SENIOR_MERCHANDISER",
        "STORE_MANAGER", "MERCHANDISER",
    ]);
    if (!auth.authorized) return auth.response;

    const orderId = params.id;

    // Verify order exists
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, order_no: true, total_amount: true },
    });
    if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Strip financial data from non-financial roles
    if (!["ACCOUNTANT", "CEO"].includes(auth.user.role)) {
        return NextResponse.json(
            { error: "Cost details restricted to financial roles" },
            { status: 403 }
        );
    }

    // Get or recalculate cost summary
    let summary = await prisma.orderCostSummary.findUnique({
        where: { order_id: orderId },
    });

    if (!summary) {
        summary = await recalculateOrderCost(orderId);
    }

    // Get recent cost events (last 10 purchases + expenses)
    const [recentPurchases, recentExpenses] = await Promise.all([
        prisma.purchase.findMany({
            where: { request: { order_id: orderId } },
            select: {
                id: true,
                purchase_no: true,
                invoice_amount: true,
                status: true,
                created_at: true,
                vendor: { select: { name: true } },
            },
            orderBy: { created_at: "desc" },
            take: 10,
        }),
        prisma.expenseRequest.findMany({
            where: { order_id: orderId },
            select: {
                id: true,
                expense_no: true,
                expected_amount: true,
                actual_amount: true,
                expense_category: true,
                status: true,
                created_at: true,
            },
            orderBy: { created_at: "desc" },
            take: 10,
        }),
    ]);

    const events = [
        ...recentPurchases.map((p) => ({
            id: p.id,
            type: "purchase" as const,
            ref: p.purchase_no,
            amount: p.invoice_amount,
            status: p.status,
            label: `Purchase to ${p.vendor.name}`,
            date: p.created_at,
        })),
        ...recentExpenses.map((e) => ({
            id: e.id,
            type: "expense" as const,
            ref: e.expense_no,
            amount: e.actual_amount ?? e.expected_amount,
            status: e.status,
            label: `${e.expense_category.replace(/_/g, " ")}`,
            date: e.created_at,
        })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

    return NextResponse.json({
        summary,
        events,
        order_no: order.order_no,
    });
}
