"use client";

import { useEffect, useState } from "react";
import {
    ShoppingCart, FileText, CheckCircle,
    ClipboardList, Eye, AlertTriangle, CalendarCheck
} from "lucide-react";
import ActionInbox from "@/components/ActionInbox";

interface DashboardData {
    assignedOrders: number;
    draftTechPacks: number;
    completedTechPacks: number;
    assignedTechPacks: number;
    submittedAwaitingReview: number;
    revisionRequired: number;
    completedThisWeek: number;
}

export default function MerchandiserDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    useEffect(() => { fetch("/api/dashboard/merchandiser").then((r) => r.json()).then(setData).catch(() => { }); }, []);

    const cards = [
        { label: "Assigned Orders", value: data?.assignedOrders ?? "—", icon: <ShoppingCart className="w-5 h-5" />, color: "text-blue-600 bg-blue-50" },
        { label: "Draft Tech Packs", value: data?.draftTechPacks ?? "—", icon: <FileText className="w-5 h-5" />, color: "text-amber-600 bg-amber-50" },
        { label: "Completed Tech Packs", value: data?.completedTechPacks ?? "—", icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600 bg-green-50" },
    ];

    const v2Cards = [
        { label: "Assigned Tech Packs", value: data?.assignedTechPacks ?? "—", icon: <ClipboardList className="w-5 h-5" />, color: "text-blue-600 bg-blue-50", urgent: false },
        { label: "Awaiting PM Review", value: data?.submittedAwaitingReview ?? "—", icon: <Eye className="w-5 h-5" />, color: "text-amber-600 bg-amber-50", urgent: false },
        { label: "Revision Required", value: data?.revisionRequired ?? "—", icon: <AlertTriangle className="w-5 h-5" />, color: "text-orange-600 bg-orange-50", urgent: (data?.revisionRequired ?? 0) > 0 },
        { label: "Completed This Week", value: data?.completedThisWeek ?? "—", icon: <CalendarCheck className="w-5 h-5" />, color: "text-green-600 bg-green-50", urgent: false },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">Merchandiser Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">Tech pack management for assigned orders</p>
            </div>

            {/* Existing KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color} mb-3`}>{card.icon}</div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* V2 KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {v2Cards.map((card) => (
                    <div key={card.label} className={`bg-white rounded-lg border ${card.urgent ? "border-orange-200" : "border-slate-200"} p-4 hover:shadow-md transition-shadow`}>
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color} mb-3`}>{card.icon}</div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                        <p className={`text-2xl font-bold mt-1 tabular-nums ${card.urgent ? "text-orange-700" : "text-slate-900"}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Revision Alert Banner */}
            {data && data.revisionRequired > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-orange-800">
                            {data.revisionRequired} tech pack{data.revisionRequired > 1 ? "s" : ""} require revision
                        </p>
                        <p className="text-xs text-orange-600 mt-0.5">Review buyer feedback and update submissions</p>
                    </div>
                </div>
            )}

            <ActionInbox />
        </div>
    );
}
