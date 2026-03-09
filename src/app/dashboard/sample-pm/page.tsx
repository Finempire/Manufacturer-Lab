"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, FileText, Package, Receipt, Factory } from "lucide-react";
import Link from "next/link";
import ActionInbox from "@/components/ActionInbox";

interface DashboardData {
    activeOrders: number;
    pendingAcceptance: number;
    techPacksInProgress: number;
    materialPending: number;
    inProduction: number;
    pendingExpenses: number;
}

export default function SamplePMDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        fetch("/api/dashboard/sample-pm")
            .then(r => r.json())
            .then(setData)
            .catch(() => {});
    }, []);

    const cards = [
        { label: "Active Orders", value: data?.activeOrders ?? "—", icon: <ShoppingCart className="w-5 h-5" />, color: "text-blue-600 bg-blue-50", link: "/dashboard/sample-pm/orders" },
        { label: "Pending Acceptance", value: data?.pendingAcceptance ?? "—", icon: <ShoppingCart className="w-5 h-5" />, color: "text-amber-600 bg-amber-50", link: "/dashboard/sample-pm/orders" },
        { label: "Tech Packs In Progress", value: data?.techPacksInProgress ?? "—", icon: <FileText className="w-5 h-5" />, color: "text-purple-600 bg-purple-50", link: "/dashboard/sample-pm/tech-packs" },
        { label: "Material Pending", value: data?.materialPending ?? "—", icon: <Package className="w-5 h-5" />, color: "text-orange-600 bg-orange-50", link: "/dashboard/sample-pm/material-needs" },
        { label: "In Production", value: data?.inProduction ?? "—", icon: <Factory className="w-5 h-5" />, color: "text-cyan-600 bg-cyan-50", link: "/dashboard/sample-pm/production" },
        { label: "Pending Expenses", value: data?.pendingExpenses ?? "—", icon: <Receipt className="w-5 h-5" />, color: "text-red-600 bg-red-50", link: "/dashboard/sample-pm/expense-requests" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">Sample PM Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">Overview of sample production operations</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {cards.map(card => (
                    <Link key={card.label} href={card.link} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow block relative group">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color} mb-3`}>{card.icon}</div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{card.value}</p>
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-600 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                ))}
            </div>

            <ActionInbox />
        </div>
    );
}
