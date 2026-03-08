"use client";

import { useEffect, useState } from "react";
import { Truck, ShoppingCart, CheckCircle } from "lucide-react";

interface DashboardData { pendingPurchases: number; myPurchases: number; pendingConfirmations: number; }

export default function RunnerDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    useEffect(() => { fetch("/api/dashboard/runner").then((r) => r.json()).then(setData).catch(() => { }); }, []);

    const cards = [
        { label: "Pending Purchases", value: data?.pendingPurchases ?? "—", icon: <Truck className="w-5 h-5" />, color: "text-amber-600 bg-amber-50" },
        { label: "My Purchases", value: data?.myPurchases ?? "—", icon: <ShoppingCart className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
        { label: "Pending Confirmations", value: data?.pendingConfirmations ?? "—", icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600 bg-green-50" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">Runner Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">Purchase assignments and vendor confirmations</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color} mb-3`}>{card.icon}</div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{card.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
