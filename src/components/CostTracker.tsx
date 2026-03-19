"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, IndianRupee } from "lucide-react";

interface CostSummary {
    id: string;
    order_id: string;
    budgeted_amount: number;
    actual_material_cost: number;
    actual_expense_cost: number;
    total_actual_cost: number;
    cost_variance: number;
    cost_variance_pct: number;
    pending_material: number;
    approved_material: number;
    paid_material: number;
    pending_expense: number;
    approved_expense: number;
    paid_expense: number;
    cost_status: "ON_BUDGET" | "WARNING" | "OVER_BUDGET";
    updated_at: string;
}

interface CostEvent {
    id: string;
    type: "purchase" | "expense";
    ref: string;
    amount: number;
    status: string;
    label: string;
    date: string;
}

interface CostTrackerProps {
    orderId: string;
}

const STATUS_CONFIG = {
    ON_BUDGET: {
        label: "On Budget",
        color: "text-green-700",
        bg: "bg-green-50",
        border: "border-green-200",
        icon: CheckCircle,
    },
    WARNING: {
        label: "Budget Warning",
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: AlertTriangle,
    },
    OVER_BUDGET: {
        label: "Over Budget",
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
        icon: TrendingUp,
    },
};

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
    });
}

export default function CostTracker({ orderId }: CostTrackerProps) {
    const [data, setData] = useState<{
        summary: CostSummary;
        events: CostEvent[];
        order_no: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCostData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/orders/${orderId}/cost-summary`);
            if (!res.ok) {
                if (res.status === 403) {
                    setError("restricted");
                    return;
                }
                throw new Error("Failed to fetch cost data");
            }
            const json = await res.json();
            setData(json);
            setError(null);
        } catch {
            setError("Failed to load cost data");
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchCostData();
    }, [fetchCostData]);

    if (error === "restricted") return null;

    if (loading) {
        return (
            <div className="rounded-lg border border-border-secondary bg-surface-1 p-4">
                <div className="flex items-center gap-2 text-foreground-secondary text-sm">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading cost data...
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="rounded-lg border border-border-secondary bg-surface-1 p-4">
                <p className="text-sm text-foreground-secondary">{error || "No cost data"}</p>
            </div>
        );
    }

    const { summary, events } = data;
    const statusConfig = STATUS_CONFIG[summary.cost_status];
    const StatusIcon = statusConfig.icon;

    // Budget utilization percentage (capped at 100% for bar display)
    const utilizationPct = summary.budgeted_amount > 0
        ? Math.min((summary.total_actual_cost / summary.budgeted_amount) * 100, 100)
        : 0;
    const overBudgetPct = summary.budgeted_amount > 0 && summary.total_actual_cost > summary.budgeted_amount
        ? ((summary.total_actual_cost - summary.budgeted_amount) / summary.budgeted_amount) * 100
        : 0;

    return (
        <div className="rounded-lg border border-border-secondary bg-surface-1 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border-secondary flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-foreground-tertiary" />
                    <h3 className="text-sm font-semibold text-foreground">Cost Tracker</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                    </span>
                    <button
                        onClick={fetchCostData}
                        className="p-1 rounded hover:bg-surface-3 text-foreground-tertiary"
                        title="Refresh"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Budget vs Actual */}
            <div className="px-4 py-3 border-b border-border-secondary">
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs text-foreground-secondary">Budget</span>
                    <span className="text-sm font-semibold tabular-nums">{formatCurrency(summary.budgeted_amount)}</span>
                </div>
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs text-foreground-secondary">Actual Cost</span>
                    <span className={`text-sm font-semibold tabular-nums ${summary.cost_status === "OVER_BUDGET" ? "text-red-600" : ""}`}>
                        {formatCurrency(summary.total_actual_cost)}
                    </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 mb-1">
                    <div className="h-2 rounded-full bg-surface-3 overflow-hidden relative">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                summary.cost_status === "OVER_BUDGET"
                                    ? "bg-red-500"
                                    : summary.cost_status === "WARNING"
                                    ? "bg-amber-500"
                                    : "bg-green-500"
                            }`}
                            style={{ width: `${utilizationPct}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-foreground-muted">
                            {utilizationPct.toFixed(0)}% used
                        </span>
                        {overBudgetPct > 0 && (
                            <span className="text-[10px] text-red-600 font-medium">
                                +{overBudgetPct.toFixed(1)}% over
                            </span>
                        )}
                    </div>
                </div>

                {/* Variance */}
                <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-border-secondary">
                    <span className="text-xs text-foreground-secondary">Variance</span>
                    <span className={`text-sm font-semibold tabular-nums flex items-center gap-1 ${
                        summary.cost_variance >= 0 ? "text-green-600" : "text-red-600"
                    }`}>
                        {summary.cost_variance >= 0 ? (
                            <TrendingDown className="w-3 h-3" />
                        ) : (
                            <TrendingUp className="w-3 h-3" />
                        )}
                        {formatCurrency(Math.abs(summary.cost_variance))}
                        <span className="text-[10px] text-foreground-muted">
                            ({summary.cost_variance_pct >= 0 ? "+" : ""}{summary.cost_variance_pct.toFixed(1)}%)
                        </span>
                    </span>
                </div>
            </div>

            {/* Breakdown table */}
            <div className="px-4 py-3 border-b border-border-secondary">
                <h4 className="text-xs font-medium text-foreground-secondary mb-2">Cost Breakdown</h4>
                <table className="w-full text-xs">
                    <thead>
                        <tr className="text-foreground-muted">
                            <th className="text-left pb-1 font-medium"></th>
                            <th className="text-right pb-1 font-medium">Pending</th>
                            <th className="text-right pb-1 font-medium">Approved</th>
                            <th className="text-right pb-1 font-medium">Paid</th>
                        </tr>
                    </thead>
                    <tbody className="text-foreground-secondary">
                        <tr>
                            <td className="py-1 font-medium text-foreground">Materials</td>
                            <td className="py-1 text-right tabular-nums">{formatCurrency(summary.pending_material)}</td>
                            <td className="py-1 text-right tabular-nums">{formatCurrency(summary.approved_material)}</td>
                            <td className="py-1 text-right tabular-nums">{formatCurrency(summary.paid_material)}</td>
                        </tr>
                        <tr>
                            <td className="py-1 font-medium text-foreground">Expenses</td>
                            <td className="py-1 text-right tabular-nums">{formatCurrency(summary.pending_expense)}</td>
                            <td className="py-1 text-right tabular-nums">{formatCurrency(summary.approved_expense)}</td>
                            <td className="py-1 text-right tabular-nums">{formatCurrency(summary.paid_expense)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr className="border-t border-border-secondary font-semibold text-foreground">
                            <td className="pt-1">Total</td>
                            <td className="pt-1 text-right tabular-nums">
                                {formatCurrency(summary.pending_material + summary.pending_expense)}
                            </td>
                            <td className="pt-1 text-right tabular-nums">
                                {formatCurrency(summary.approved_material + summary.approved_expense)}
                            </td>
                            <td className="pt-1 text-right tabular-nums">
                                {formatCurrency(summary.paid_material + summary.paid_expense)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Recent cost events */}
            {events.length > 0 && (
                <div className="px-4 py-3">
                    <h4 className="text-xs font-medium text-foreground-secondary mb-2">Recent Activity</h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {events.map((event) => (
                            <div key={event.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                        event.type === "purchase" ? "bg-blue-400" : "bg-purple-400"
                                    }`} />
                                    <span className="text-foreground truncate">{event.label}</span>
                                    <span className="text-foreground-muted flex-shrink-0">{event.ref}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                    <span className="tabular-nums font-medium">{formatCurrency(event.amount)}</span>
                                    <span className="text-foreground-muted">{formatDate(event.date)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
