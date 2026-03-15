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
        { label: "Overdue Tax Invoices", value: data?.overdueTaxInvoices ?? "—", icon: <Clock className="w-5 h-5" />, color: "text-red-600 bg-red-50", urgent: (data?.overdueTaxInvoices ?? 0) > 0 },
        { label: "Pending Final Sign-off", value: data?.pendingFinalSignoff ?? "—", icon: <CheckSquare className="w-5 h-5" />, color: "text-amber-600 bg-amber-50", urgent: (data?.pendingFinalSignoff ?? 0) > 0 },
        { label: "Runners Active / Total", value: data ? `${data.activeRunners} / ${data.totalRunners}` : "—", icon: <UserCheck className="w-5 h-5" />, color: "text-blue-600 bg-blue-50", urgent: false },
        { label: "Daily Exceptions", value: data?.dailyExceptions ?? "—", icon: <AlertTriangle className="w-5 h-5" />, color: "text-red-600 bg-red-50", urgent: (data?.dailyExceptions ?? 0) > 0 },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Overview of financial operations</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link href="/dashboard/accountant/orders" className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                        + Create Order
                    </Link>
                    <Link href="/dashboard/accountant/expense-requests/new" className="px-4 py-2 text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md transition-colors">
                        + Expense Request
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {cards.map((card) => {
                    const content = (
                        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</p>
                            <p className="text-2xl font-semibold tabular-nums text-slate-900 mt-2">{card.value}</p>
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
                    <div key={card.label} className={`bg-white rounded-lg border ${card.urgent ? "border-red-200" : "border-slate-200"} p-4 hover:shadow-md transition-shadow`}>
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color} mb-3`}>{card.icon}</div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                        <p className={`text-2xl font-bold mt-1 tabular-nums ${card.urgent ? "text-red-700" : "text-slate-900"}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Pending Approvals Summary */}
            <div className="bg-white border border-slate-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Pending Approvals Summary</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 font-medium">Purchase Approvals</p>
                        <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{data?.pendingPurchaseApprovals ?? "—"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 font-medium">Expense Approvals</p>
                        <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{data?.pendingExpenseApprovals ?? "—"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 font-medium">Pending Payments</p>
                        <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{data?.pendingPayments ?? "—"}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 font-medium">Final Sign-offs</p>
                        <p className="text-xl font-bold text-slate-900 mt-1 tabular-nums">{data?.pendingFinalSignoff ?? "—"}</p>
                    </div>
                </div>
            </div>

            {/* Action Inbox */}
            <ActionInbox />
        </div>
    );
}
