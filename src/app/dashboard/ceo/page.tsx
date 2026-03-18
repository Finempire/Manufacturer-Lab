"use client";

import { useEffect, useState } from "react";
import { BarChart3, ShoppingCart, CreditCard, Receipt } from "lucide-react";
import ActionInbox from "@/components/ActionInbox";

interface DashboardData { totalOrders: number; activeOrders: number; totalPaid: number; totalExpenses: number; }

export default function CeoDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    useEffect(() => { fetch("/api/dashboard/ceo").then((r) => r.json()).then(setData).catch(() => { }); }, []);

    const cards = [
        { label: "Total Orders", value: data?.totalOrders ?? "—", icon: <ShoppingCart className="w-5 h-5" />, color: "text-blue-400 bg-blue-500/10" },
        { label: "Active Orders", value: data?.activeOrders ?? "—", icon: <BarChart3 className="w-5 h-5" />, color: "text-amber-400 bg-amber-500/10" },
        { label: "Total Paid", value: data ? `₹${data.totalPaid.toLocaleString("en-IN")}` : "—", icon: <CreditCard className="w-5 h-5" />, color: "text-green-400 bg-green-500/10" },
        { label: "Total Expenses", value: data ? `₹${data.totalExpenses.toLocaleString("en-IN")}` : "—", icon: <Receipt className="w-5 h-5" />, color: "text-purple-400 bg-purple-500/10" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">CEO Dashboard</h1>
                <p className="text-sm text-foreground-tertiary mt-1">High-level business overview and financial summary</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <div key={card.label} className="bg-surface-1 rounded-lg border border-border-secondary p-4 hover:shadow-premium-md transition-shadow">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color} mb-3`}>{card.icon}</div>
                        <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">{card.label}</p>
                        <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{card.value}</p>
                    </div>
                ))}
            </div>
            <ActionInbox />
        </div>
    );
}
