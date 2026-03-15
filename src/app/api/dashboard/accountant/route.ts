import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

export async function GET() {
    const auth = await requireRole(["ACCOUNTANT"]);
    if (!auth.authorized) return auth.response;

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));

    const [
        pendingPurchases,
        pendingPayments,
        activeOrders,
        pendingExpenses,
        todayPayments,
        totalUsers,
        overdueTaxInvoices,
        pendingFinalSignoff,
        activeRunners,
        totalRunners,
        dailyExceptions,
        pendingPurchaseApprovals,
        pendingExpenseApprovals,
    ] = await Promise.all([
        prisma.purchase.count({ where: { status: "INVOICE_SUBMITTED" } }),
        prisma.purchase.count({ where: { status: { in: ["APPROVED", "PARTIALLY_PAID"] } } }),
        prisma.order.count({ where: { status: { not: "COMPLETED" } } }),
        prisma.expenseRequest.count({ where: { status: "PENDING_APPROVAL" } }),
        prisma.payment.aggregate({
            _sum: { amount_paid: true },
            where: {
                payment_date: { gte: todayStart },
            },
        }),
        prisma.user.count({ where: { is_active: true } }),
        // Overdue final tax invoices: purchases paid with provisional invoice but no tax invoice
        prisma.purchase.count({
            where: {
                status: "PAID_PENDING_TAX_INVOICE",
                invoice_type_submitted: "PROVISIONAL",
                tax_invoice_path: null,
            },
        }),
        // Orders pending final sign-off
        prisma.order.count({
            where: { status: "PRODUCTION_COMPLETED" },
        }),
        // Active runners (runners with at least one in-progress assignment)
        prisma.user.count({
            where: {
                role: "RUNNER",
                is_active: true,
                assigned_requests: {
                    some: { status: { in: ["PENDING_PURCHASE", "INVOICE_SUBMITTED"] } },
                },
            },
        }),
        // Total runners
        prisma.user.count({
            where: { role: "RUNNER", is_active: true },
        }),
        // Daily exception count: orders/purchases with exception flags
        prisma.order.count({
            where: {
                exception_flags: { isEmpty: false },
                status: { not: "COMPLETED" },
            },
        }),
        // Pending purchase approvals (same as pendingPurchases but explicit)
        prisma.purchase.count({ where: { status: "INVOICE_SUBMITTED" } }),
        // Pending expense approvals
        prisma.expenseRequest.count({ where: { status: "PENDING_APPROVAL" } }),
    ]);

    return NextResponse.json({
        pendingPurchases,
        pendingPayments,
        activeOrders,
        pendingExpenses,
        todayPaid: todayPayments._sum.amount_paid || 0,
        totalUsers,
        overdueTaxInvoices,
        pendingFinalSignoff,
        activeRunners,
        totalRunners,
        dailyExceptions,
        pendingPurchaseApprovals,
        pendingExpenseApprovals,
    });
}
