import { prisma } from "@/lib/prisma";
import { CostStatus, OrderCostSummary } from "@prisma/client";

/**
 * Recalculate and upsert the OrderCostSummary for a given order.
 * Call this after any purchase status change, payment creation,
 * or expense status change linked to this order.
 */
export async function recalculateOrderCost(orderId: string): Promise<OrderCostSummary> {
    // 1. Get order budget
    const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
        select: { total_amount: true },
    });

    // 2. Get all purchases linked to this order (via material_request.order_id)
    const purchases = await prisma.purchase.findMany({
        where: { request: { order_id: orderId } },
        select: { invoice_amount: true, status: true },
    });

    // 3. Get all expense requests linked to this order
    const expenses = await prisma.expenseRequest.findMany({
        where: { order_id: orderId },
        select: { expected_amount: true, actual_amount: true, status: true },
    });

    // 4. Aggregate material costs by payment stage
    let pending_material = 0;
    let approved_material = 0;
    let paid_material = 0;

    for (const p of purchases) {
        const amt = p.invoice_amount;
        switch (p.status) {
            case "INVOICE_SUBMITTED":
            case "PENDING_PURCHASE":
            case "SELF_PURCHASE":
                pending_material += amt;
                break;
            case "APPROVED":
                approved_material += amt;
                break;
            case "PAID":
            case "PARTIALLY_PAID":
            case "PAID_PENDING_TAX_INVOICE":
            case "COMPLETED":
                paid_material += amt;
                break;
            // REJECTED / CANCELLED don't count
        }
    }

    // 5. Aggregate expense costs by payment stage
    let pending_expense = 0;
    let approved_expense = 0;
    let paid_expense = 0;

    for (const e of expenses) {
        const amt = e.actual_amount ?? e.expected_amount;
        switch (e.status) {
            case "PENDING_APPROVAL":
                pending_expense += amt;
                break;
            case "APPROVED":
            case "PENDING_PAYMENT":
                approved_expense += amt;
                break;
            case "PAID":
            case "COMPLETED":
                paid_expense += amt;
                break;
            // REJECTED / CANCELLED don't count
        }
    }

    // 6. Totals
    const actual_material_cost = pending_material + approved_material + paid_material;
    const actual_expense_cost = pending_expense + approved_expense + paid_expense;
    const total_actual_cost = actual_material_cost + actual_expense_cost;

    const budgeted = order.total_amount || 0;
    const cost_variance = budgeted - total_actual_cost;
    const cost_variance_pct = budgeted > 0
        ? ((cost_variance / budgeted) * 100)
        : 0;

    // 7. Determine cost status
    let cost_status: CostStatus = "ON_BUDGET";
    if (budgeted > 0) {
        const ratio = total_actual_cost / budgeted;
        if (ratio > 1.10) cost_status = "OVER_BUDGET";
        else if (ratio > 1.05) cost_status = "WARNING";
    }

    // 8. Upsert
    const summary = await prisma.orderCostSummary.upsert({
        where: { order_id: orderId },
        create: {
            order_id: orderId,
            budgeted_amount: budgeted,
            actual_material_cost,
            actual_expense_cost,
            total_actual_cost,
            cost_variance,
            cost_variance_pct,
            pending_material,
            approved_material,
            paid_material,
            pending_expense,
            approved_expense,
            paid_expense,
            cost_status,
        },
        update: {
            budgeted_amount: budgeted,
            actual_material_cost,
            actual_expense_cost,
            total_actual_cost,
            cost_variance,
            cost_variance_pct,
            pending_material,
            approved_material,
            paid_material,
            pending_expense,
            approved_expense,
            paid_expense,
            cost_status,
        },
    });

    return summary;
}

/**
 * Get order_id from a purchase (via its material request).
 */
export async function getOrderIdFromPurchase(purchaseId: string): Promise<string | null> {
    const purchase = await prisma.purchase.findUnique({
        where: { id: purchaseId },
        select: { request: { select: { order_id: true } } },
    });
    return purchase?.request?.order_id ?? null;
}
