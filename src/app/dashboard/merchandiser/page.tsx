"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Package, Receipt, Truck } from "lucide-react";
import ActionInbox from "@/components/ActionInbox";

interface DashboardData {
    totalOrders: number;
    pendingRequirements: number;
    myPurchases: number;
    myExpenses: number;
}

export default function MerchandiserDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    useEffect(() => { fetch("/api/dashboard/merchandiser").then((r) => r.json()).then(setData).catch(() => { }); }, []);

    const cards = [
        { label: "Total Orders", value: data?.totalOrders ?? "—", icon: <ShoppingCart className="w-5 h-5" />, color: "text-blue-400 bg-blue-500/10" },
        { label: "Pending Requirements", value: data?.pendingRequirements ?? "—", icon: <Package className="w-5 h-5" />, color: "text-amber-400 bg-amber-500/10" },
        { label: "My Purchases", value: data?.myPurchases ?? "—", icon: <Truck className="w-5 h-5" />, color: "text-indigo-400 bg-indigo-500/10" },
        { label: "My Expenses", value: data?.myExpenses ?? "—", icon: <Receipt className="w-5 h-5" />, color: "text-emerald-400 bg-emerald-500/10" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Merchandiser Dashboard</h1>
                <p className="text-sm text-foreground-tertiary mt-1">Orders, requests, and purchases</p>
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
