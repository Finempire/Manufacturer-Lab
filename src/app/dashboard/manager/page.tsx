"use client";

import { useEffect, useState } from "react";
import {
    ClipboardList, Package, Receipt,
    Inbox, FileText, UserCheck, Users, AlertTriangle, XCircle, ShieldAlert
} from "lucide-react";
import ActionInbox from "@/components/ActionInbox";

interface DashboardData {
    materialRequirements: number;
    pendingRequests: number;
    myExpenses: number;
    needRequestsAwaitingAcceptance: number;
    purchaseRequestsToCreate: number;
    runnersAssigned: number;
    runnersAvailable: number;
    purchasesPendingInvoice: number;
    purchasesRejected: number;
    completionBlockers: number;
}

export default function StoreManagerDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    useEffect(() => { fetch("/api/dashboard/manager").then((r) => r.json()).then(setData).catch(() => { }); }, []);

    const cards = [
        { label: "Material Requirements", value: data?.materialRequirements ?? "—", icon: <ClipboardList className="w-5 h-5" />, color: "text-blue-400 bg-blue-500/10" },
        { label: "Pending Requests", value: data?.pendingRequests ?? "—", icon: <Package className="w-5 h-5" />, color: "text-amber-400 bg-amber-500/10" },
        { label: "My Expenses", value: data?.myExpenses ?? "—", icon: <Receipt className="w-5 h-5" />, color: "text-green-400 bg-green-500/10" },
    ];

    const v2Cards = [
        { label: "Awaiting Acceptance", value: data?.needRequestsAwaitingAcceptance ?? "—", icon: <Inbox className="w-5 h-5" />, color: "text-amber-400 bg-amber-500/10", urgent: (data?.needRequestsAwaitingAcceptance ?? 0) > 0 },
        { label: "Purchase Requests to Create", value: data?.purchaseRequestsToCreate ?? "—", icon: <FileText className="w-5 h-5" />, color: "text-blue-400 bg-blue-500/10", urgent: (data?.purchaseRequestsToCreate ?? 0) > 0 },
        { label: "Purchases Pending Invoice", value: data?.purchasesPendingInvoice ?? "—", icon: <Package className="w-5 h-5" />, color: "text-orange-400 bg-orange-500/10", urgent: false },
        { label: "Purchases Rejected", value: data?.purchasesRejected ?? "—", icon: <XCircle className="w-5 h-5" />, color: "text-red-400 bg-red-500/10", urgent: (data?.purchasesRejected ?? 0) > 0 },
        { label: "Completion Blockers", value: data?.completionBlockers ?? "—", icon: <ShieldAlert className="w-5 h-5" />, color: "text-red-400 bg-red-500/10", urgent: (data?.completionBlockers ?? 0) > 0 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Store Manager Dashboard</h1>
                <p className="text-sm text-foreground-tertiary mt-1">Material requirements and purchase requests</p>
            </div>

            {/* Existing KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

            {/* Runner Status Summary */}
            <div className="bg-surface-1 border border-border-secondary rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-blue-400" />
                    <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Runner Status</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-surface-3 rounded-lg p-3">
                        <p className="text-xs text-foreground-tertiary font-medium">Assigned (Busy)</p>
                        <p className="text-xl font-bold text-foreground mt-1 tabular-nums">{data?.runnersAssigned ?? "—"}</p>
                    </div>
                    <div className="bg-surface-3 rounded-lg p-3">
                        <p className="text-xs text-foreground-tertiary font-medium">Available</p>
                        <p className="text-xl font-bold text-green-400 mt-1 tabular-nums">{data?.runnersAvailable ?? "—"}</p>
                    </div>
                    <div className="bg-surface-3 rounded-lg p-3">
                        <p className="text-xs text-foreground-tertiary font-medium">Total Runners</p>
                        <p className="text-xl font-bold text-foreground mt-1 tabular-nums">{data ? data.runnersAssigned + data.runnersAvailable : "—"}</p>
                    </div>
                </div>
            </div>

            <ActionInbox />
        </div>
    );
}
