"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, FileText, ClipboardList, Receipt } from "lucide-react";
import ActionInbox from "@/components/ActionInbox";

interface DashboardData {
    newOrders: number;
    pendingTechPacks: number;
    materialRequirements: number;
    pendingExpenses: number;
}

export default function ProductionDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        fetch("/api/dashboard/production").then((r) => r.json()).then(setData).catch(() => { });
    }, []);

    const cards = [
        { label: "New Orders", value: data?.newOrders ?? "—", icon: <ShoppingCart className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
        { label: "Pending Tech Packs", value: data?.pendingTechPacks ?? "—", icon: <FileText className="w-5 h-5" />, color: "text-amber-600 bg-amber-50" },
        { label: "Material Requirements", value: data?.materialRequirements ?? "—", icon: <ClipboardList className="w-5 h-5" />, color: "text-green-600 bg-green-50" },
        { label: "My Expenses", value: data?.pendingExpenses ?? "—", icon: <Receipt className="w-5 h-5" />, color: "text-purple-600 bg-purple-50" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">Production Manager Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">Order management and production workflow</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color} mb-3`}>{card.icon}</div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{card.value}</p>
                    </div>
                ))}
            </div>
            <ActionInbox />
        </div>
    );
}
