"use client";

import { useEffect, useState } from "react";
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
        { label: "Pending Purchases", value: data?.pendingPurchases ?? "—", icon: <Package className="w-5 h-5" />, color: "text-amber-600 bg-amber-50" },
        { label: "Pending Payments", value: data?.pendingPayments ?? "—", icon: <CreditCard className="w-5 h-5" />, color: "text-red-600 bg-red-50" },
        { label: "Active Orders", value: data?.activeOrders ?? "—", icon: <ShoppingCart className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
        { label: "Pending Expenses", value: data?.pendingExpenses ?? "—", icon: <Receipt className="w-5 h-5" />, color: "text-purple-600 bg-purple-50" },
        { label: "Paid Today", value: data ? `₹${data.todayPaid.toLocaleString("en-IN")}` : "—", icon: <FileText className="w-5 h-5" />, color: "text-green-600 bg-green-50" },
        { label: "Total Users", value: data?.totalUsers ?? "—", icon: <Users className="w-5 h-5" />, color: "text-indigo-600 bg-indigo-50", link: "/dashboard/accountant/users" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Accountant Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Overview of financial operations</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <a href="/dashboard/accountant/orders/new" className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
                        + Create Order
                    </a>
                    <a href="/dashboard/accountant/expense-requests/new" className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200">
                        + Expense Request
                    </a>
                    <a href="/dashboard/accountant/users" className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200">
                        + Add User
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {cards.map((card) => {
                    const CardContent = (
                        <>
                            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color} mb-3`}>
                                {card.icon}
                            </div>
                            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{card.value}</p>
                        </>
                    );

                    return card.link ? (
                        <a href={card.link} key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow block relative group">
                            {CardContent}
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-600 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                    ) : (
                        <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                            {CardContent}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
