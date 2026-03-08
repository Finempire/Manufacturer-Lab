"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, CreditCard, Receipt, Package, FileText, Users } from "lucide-react";

interface DashboardData {
    pendingPurchases: number;
    pendingPayments: number;
    activeOrders: number;
    pendingExpenses: number;
    todayPaid: number;
    totalUsers: number;
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
        </div>
    );
}
