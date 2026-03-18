"use client";

import { useEffect, useState } from "react";
import {
    ShoppingCart, FileText, ClipboardList, Receipt,
    AlertTriangle, Factory, Truck, ShieldAlert, Eye, CheckCircle
} from "lucide-react";
import ActionInbox from "@/components/ActionInbox";

interface StageItem {
    stage: string;
    count: number;
}

interface DashboardData {
    newOrders: number;
    pendingTechPacks: number;
    materialRequirements: number;
    pendingExpenses: number;
    stageDistribution: StageItem[];
    techPacksAwaitingReview: number;
    materialPendingAcceptance: number;
    productionReadyOrders: number;
    delayedShippingRisk: number;
    blockedOrders: number;
}

const STAGE_LABELS: Record<string, string> = {
    ORDER_RECEIVED: "Received",
    PENDING_PM_ACCEPTANCE: "PM Accept",
    MERCHANDISER_ASSIGNED: "Merch Assigned",
    TECH_PACK_IN_PROGRESS: "Tech Pack WIP",
    TECH_PACK_COMPLETED: "Tech Pack Done",
    MATERIAL_REQUIREMENT_SENT: "Mat. Req Sent",
    MATERIAL_IN_PROGRESS: "Material WIP",
    MATERIAL_COMPLETED: "Material Done",
    PRODUCTION_ACCEPTED: "Prod Accepted",
    UNDER_PRODUCTION: "In Production",
    PRODUCTION_COMPLETED: "Prod Complete",
    CANCELLED: "Cancelled",
};

export default function ProductionDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        fetch("/api/dashboard/production").then((r) => r.json()).then(setData).catch(() => { });
    }, []);

    const cards = [
        { label: "New Orders", value: data?.newOrders ?? "—", icon: <ShoppingCart className="w-5 h-5" />, color: "text-blue-400 bg-blue-500/10" },
        { label: "Pending Tech Packs", value: data?.pendingTechPacks ?? "—", icon: <FileText className="w-5 h-5" />, color: "text-amber-400 bg-amber-500/10" },
        { label: "Material Requirements", value: data?.materialRequirements ?? "—", icon: <ClipboardList className="w-5 h-5" />, color: "text-green-400 bg-green-500/10" },
        { label: "My Expenses", value: data?.pendingExpenses ?? "—", icon: <Receipt className="w-5 h-5" />, color: "text-purple-400 bg-purple-500/10" },
    ];

    const v2Cards = [
        { label: "Tech Packs Awaiting Review", value: data?.techPacksAwaitingReview ?? "—", icon: <Eye className="w-5 h-5" />, color: "text-amber-400 bg-amber-500/10", urgent: (data?.techPacksAwaitingReview ?? 0) > 0 },
        { label: "Material Pending Acceptance", value: data?.materialPendingAcceptance ?? "—", icon: <ClipboardList className="w-5 h-5" />, color: "text-orange-400 bg-orange-500/10", urgent: (data?.materialPendingAcceptance ?? 0) > 0 },
        { label: "Production-Ready Orders", value: data?.productionReadyOrders ?? "—", icon: <Factory className="w-5 h-5" />, color: "text-green-400 bg-green-500/10", urgent: false },
        { label: "Delayed Shipping Risk", value: data?.delayedShippingRisk ?? "—", icon: <Truck className="w-5 h-5" />, color: "text-red-400 bg-red-500/10", urgent: (data?.delayedShippingRisk ?? 0) > 0 },
        { label: "Blocked Orders", value: data?.blockedOrders ?? "—", icon: <ShieldAlert className="w-5 h-5" />, color: "text-red-400 bg-red-500/10", urgent: (data?.blockedOrders ?? 0) > 0 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Production Manager Dashboard</h1>
                <p className="text-sm text-foreground-tertiary mt-1">Order management and production workflow</p>
            </div>

            {/* Existing KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <div key={card.label} className="bg-surface-1 rounded-lg border border-border-secondary p-4 hover:shadow-premium-md transition-shadow">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color} mb-3`}>{card.icon}</div>
                        <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">{card.label}</p>
                        <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* V2 KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {v2Cards.map((card) => (
                    <div key={card.label} className={`bg-surface-1 rounded-lg border ${card.urgent ? "border-red-500/20" : "border-border-secondary"} p-4 hover:shadow-premium-md transition-shadow`}>
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color} mb-3`}>{card.icon}</div>
                        <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">{card.label}</p>
                        <p className={`text-2xl font-bold mt-1 tabular-nums ${card.urgent ? "text-red-400" : "text-foreground"}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Orders by Stage Distribution */}
            {data?.stageDistribution && data.stageDistribution.length > 0 && (
                <div className="bg-surface-1 border border-border-secondary rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-blue-400" />
                        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Orders by Stage</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {data.stageDistribution.map((item) => (
                            <div key={item.stage} className="bg-surface-3 rounded-lg p-3">
                                <p className="text-xs text-foreground-tertiary font-medium truncate" title={item.stage}>
                                    {STAGE_LABELS[item.stage] || item.stage.replace(/_/g, " ")}
                                </p>
                                <p className="text-xl font-bold text-foreground mt-1 tabular-nums">{item.count}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ActionInbox />
        </div>
    );
}
