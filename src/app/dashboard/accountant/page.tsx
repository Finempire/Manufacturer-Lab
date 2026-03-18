"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ShoppingCart, CreditCard, Receipt, Package, FileText, Users,
    AlertTriangle, CheckSquare, UserCheck, Clock, ShieldAlert
} from "lucide-react";
import ActionInbox from "@/components/ActionInbox";

interface DashboardData {
    pendingPurchases: number;
    pendingPayments: number;
    activeOrders: number;
    pendingExpenses: number;
    todayPaid: number;
    totalUsers: number;
    overdueTaxInvoices: number;
    pendingFinalSignoff: number;
    activeRunners: number;
    totalRunners: number;
    dailyExceptions: number;
    pendingPurchaseApprovals: number;
    pendingExpenseApprovals: number;
}

export default function AccountantDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        fetch("/api/dashboard/accountant")
            .then((r) => r.json())
            .then(setData)
            .catch(() => { });
    }, []);

    const cards = [
        { label: "Pending Purchases", value: data?.pendingPurchases ?? "—", icon: <Package className="w-5 h-5" /> },
        { label: "Pending Payments", value: data?.pendingPayments ?? "—", icon: <CreditCard className="w-5 h-5" /> },
        { label: "Active Orders", value: data?.activeOrders ?? "—", icon: <ShoppingCart className="w-5 h-5" /> },
        { label: "Pending Expenses", value: data?.pendingExpenses ?? "—", icon: <Receipt className="w-5 h-5" /> },
        { label: "Paid Today", value: data ? `₹${data.todayPaid.toLocaleString("en-IN")}` : "—", icon: <FileText className="w-5 h-5" /> },
        { label: "Total Users", value: data?.totalUsers ?? "—", icon: <Users className="w-5 h-5" />, link: "/dashboard/accountant/users" },
    ];

    const v2Cards = [
        { label: "Overdue Tax Invoices", value: data?.overdueTaxInvoices ?? "—", icon: <Clock className="w-5 h-5" />, color: "text-red-400 bg-red-500/10", urgent: (data?.overdueTaxInvoices ?? 0) > 0 },
        { label: "Pending Final Sign-off", value: data?.pendingFinalSignoff ?? "—", icon: <CheckSquare className="w-5 h-5" />, color: "text-amber-400 bg-amber-500/10", urgent: (data?.pendingFinalSignoff ?? 0) > 0 },
        { label: "Runners Active / Total", value: data ? `${data.activeRunners} / ${data.totalRunners}` : "—", icon: <UserCheck className="w-5 h-5" />, color: "text-blue-400 bg-blue-500/10", urgent: false },
        { label: "Daily Exceptions", value: data?.dailyExceptions ?? "—", icon: <AlertTriangle className="w-5 h-5" />, color: "text-red-400 bg-red-500/10", urgent: (data?.dailyExceptions ?? 0) > 0 },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-sm text-foreground-tertiary mt-0.5">Overview of financial operations</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link href="/dashboard/accountant/orders" className="px-4 py-2 text-sm font-medium bg-brand hover:bg-brand-hover text-white rounded-md transition-colors">
                        + Create Order
                    </Link>
                    <Link href="/dashboard/accountant/expense-requests/new" className="px-4 py-2 text-sm font-medium bg-surface-2 border border-border hover:bg-surface-3 text-foreground-secondary rounded-md transition-colors">
                        + Expense Request
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {cards.map((card) => {
                    const content = (
                        <div className="bg-surface-1 border border-border-secondary rounded-lg p-4 shadow-premium-sm hover:shadow-premium-md hover:border-border-accent transition-all">
                            <p className="text-xs font-medium text-foreground-tertiary uppercase tracking-wide">{card.label}</p>
                            <p className="text-2xl font-semibold tabular-nums text-foreground mt-2">{card.value}</p>
                        </div>
                    );

                    return card.link ? (
                        <Link href={card.link} key={card.label} className="block">
                            {content}
                        </Link>
                    ) : (
                        <div key={card.label}>{content}</div>
                    );
                })}
            </div>

            {/* V2 KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {v2Cards.map((card) => (
                    <div key={card.label} className={`bg-surface-1 rounded-lg border ${card.urgent ? "border-red-500/20" : "border-border-secondary"} p-4 hover:shadow-premium-md transition-shadow`}>
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color} mb-3`}>{card.icon}</div>
                        <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">{card.label}</p>
                        <p className={`text-2xl font-bold mt-1 tabular-nums ${card.urgent ? "text-red-400" : "text-foreground"}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Pending Approvals Summary */}
            <div className="bg-surface-1 border border-border-secondary rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Pending Approvals Summary</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-surface-3 rounded-lg p-3">
                        <p className="text-xs text-foreground-tertiary font-medium">Purchase Approvals</p>
                        <p className="text-xl font-bold text-foreground mt-1 tabular-nums">{data?.pendingPurchaseApprovals ?? "—"}</p>
                    </div>
                    <div className="bg-surface-3 rounded-lg p-3">
                        <p className="text-xs text-foreground-tertiary font-medium">Expense Approvals</p>
                        <p className="text-xl font-bold text-foreground mt-1 tabular-nums">{data?.pendingExpenseApprovals ?? "—"}</p>
                    </div>
                    <div className="bg-surface-3 rounded-lg p-3">
                        <p className="text-xs text-foreground-tertiary font-medium">Pending Payments</p>
                        <p className="text-xl font-bold text-foreground mt-1 tabular-nums">{data?.pendingPayments ?? "—"}</p>
                    </div>
                    <div className="bg-surface-3 rounded-lg p-3">
                        <p className="text-xs text-foreground-tertiary font-medium">Final Sign-offs</p>
                        <p className="text-xl font-bold text-foreground mt-1 tabular-nums">{data?.pendingFinalSignoff ?? "—"}</p>
                    </div>
                </div>
            </div>

            {/* Action Inbox */}
            <ActionInbox />
        </div>
    );
}
