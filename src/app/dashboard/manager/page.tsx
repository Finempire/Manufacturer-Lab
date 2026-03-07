"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Package, Receipt } from "lucide-react";

interface DashboardData { materialRequirements: number; pendingRequests: number; myExpenses: number; }

export default function StoreManagerDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    useEffect(() => { fetch("/api/dashboard/manager").then((r) => r.json()).then(setData).catch(() => { }); }, []);

    const cards = [
        { label: "Material Requirements", value: data?.materialRequirements ?? "—", icon: <ClipboardList className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
        { label: "Pending Requests", value: data?.pendingRequests ?? "—", icon: <Package className="w-5 h-5" />, color: "text-amber-600 bg-amber-50" },
        { label: "My Expenses", value: data?.myExpenses ?? "—", icon: <Receipt className="w-5 h-5" />, color: "text-green-600 bg-green-50" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Store Manager Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Material requirements and purchase requests</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color} mb-3`}>{card.icon}</div>
                        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1 tabular-nums">{card.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
