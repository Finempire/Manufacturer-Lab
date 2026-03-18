"use client";

import { useEffect, useState } from "react";
import {
    BarChart3,
    ShoppingCart,
    CreditCard,
    Receipt,
    CheckCircle2,
    AlertTriangle,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

interface BuyerSummaryItem {
    buyer_name: string;
    active_orders: number;
    total_orders: number;
    total_paid: number;
}

interface DelayedOrderItem {
    id: string;
    order_no: string;
    buyer: string;
    stage: string;
    shipping_date: string;
    days_delayed: number;
}

interface StageItem {
    stage: string;
    count: number;
}

interface TrendItem {
    month: string;
    amount: number;
}

interface DashboardData {
    totalOrders: number;
    activeOrders: number;
    totalPaid: number;
    totalExpenses: number;
    ordersByStage: StageItem[];
    buyerSummary: BuyerSummaryItem[];
    delayedOrders: DelayedOrderItem[];
    pendingSignoff: number;
    expenseTrend: TrendItem[];
    procurementTrend: TrendItem[];
    exceptionCount: number;
}

const STAGE_LABELS: Record<string, string> = {
    ORDER_RECEIVED: "Received",
    PENDING_PM_ACCEPTANCE: "PM Accept",
    MERCHANDISER_ASSIGNED: "Merch Assign",
    TECH_PACK_IN_PROGRESS: "Tech Pack",
    TECH_PACK_COMPLETED: "TP Done",
    MATERIAL_REQUIREMENT_SENT: "Mat Req Sent",
    MATERIAL_IN_PROGRESS: "Mat In Prog",
    MATERIAL_COMPLETED: "Mat Done",
    PRODUCTION_ACCEPTED: "Prod Accept",
    UNDER_PRODUCTION: "In Prod",
    PRODUCTION_COMPLETED: "Prod Done",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
};

function formatCurrency(val: number): string {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${val.toLocaleString("en-IN")}`;
}

function formatMonthLabel(ym: string): string {
    const [year, month] = ym.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(month, 10) - 1]} ${year.slice(2)}`;
}

function riskColor(days: number): string {
    if (days > 14) return "text-red-500";
    if (days > 7) return "text-amber-500";
    return "text-yellow-500";
}

function riskBg(days: number): string {
    if (days > 14) return "bg-red-500/10";
    if (days > 7) return "bg-amber-500/10";
    return "bg-yellow-500/10";
}

export default function CeoDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/dashboard/ceo")
            .then((r) => r.json())
            .then((d) => {
                setData(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Build merged trend data for dual bar chart
    const trendData = buildTrendData(
        data?.expenseTrend ?? [],
        data?.procurementTrend ?? []
    );

    const stageData = (data?.ordersByStage ?? []).map((s) => ({
        stage: STAGE_LABELS[s.stage] || s.stage,
        count: s.count,
    }));

    const kpiCards = [
        {
            label: "Total Orders",
            value: data?.totalOrders ?? "—",
            icon: <ShoppingCart className="w-5 h-5" />,
            color: "text-blue-400 bg-blue-500/10",
        },
        {
            label: "Active Orders",
            value: data?.activeOrders ?? "—",
            icon: <BarChart3 className="w-5 h-5" />,
            color: "text-amber-400 bg-amber-500/10",
        },
        {
            label: "Total Paid",
            value: data ? formatCurrency(data.totalPaid) : "—",
            icon: <CreditCard className="w-5 h-5" />,
            color: "text-green-400 bg-green-500/10",
        },
        {
            label: "Total Expenses",
            value: data ? formatCurrency(data.totalExpenses) : "—",
            icon: <Receipt className="w-5 h-5" />,
            color: "text-purple-400 bg-purple-500/10",
        },
        {
            label: "Pending Sign-off",
            value: data?.pendingSignoff ?? "—",
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: "text-cyan-400 bg-cyan-500/10",
        },
        {
            label: "Exceptions",
            value: data?.exceptionCount ?? "—",
            icon: <AlertTriangle className="w-5 h-5" />,
            color: "text-red-400 bg-red-500/10",
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                    CEO Dashboard
                </h1>
                <p className="text-sm text-foreground-tertiary mt-1">
                    High-level business overview and financial summary
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {kpiCards.map((card) => (
                    <div
                        key={card.label}
                        className="bg-surface-1 rounded-lg border border-border-secondary p-4"
                    >
                        <div
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${card.color} mb-3`}
                        >
                            {card.icon}
                        </div>
                        <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">
                            {card.label}
                        </p>
                        <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
                            {card.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders by Stage */}
                <div className="bg-surface-1 rounded-lg border border-border-secondary p-5">
                    <h2 className="text-sm font-semibold text-foreground mb-4">
                        Orders by Stage
                    </h2>
                    {stageData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={stageData}
                                margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--color-border-secondary, #333)"
                                />
                                <XAxis
                                    dataKey="stage"
                                    tick={{ fontSize: 11, fill: "var(--color-foreground-tertiary, #999)" }}
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                    height={70}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: "var(--color-foreground-tertiary, #999)" }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--color-surface-2, #1a1a1a)",
                                        border: "1px solid var(--color-border, #444)",
                                        borderRadius: "8px",
                                        color: "var(--color-foreground, #fff)",
                                        fontSize: 12,
                                    }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="var(--color-brand, #6366f1)"
                                    radius={[4, 4, 0, 0]}
                                    name="Orders"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-foreground-tertiary py-12 text-center">
                            No order data available
                        </p>
                    )}
                </div>

                {/* Expense vs Procurement Trend */}
                <div className="bg-surface-1 rounded-lg border border-border-secondary p-5">
                    <h2 className="text-sm font-semibold text-foreground mb-4">
                        Expense vs Procurement (6 Months)
                    </h2>
                    {trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={trendData}
                                margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="var(--color-border-secondary, #333)"
                                />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 11, fill: "var(--color-foreground-tertiary, #999)" }}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: "var(--color-foreground-tertiary, #999)" }}
                                    tickFormatter={(v) =>
                                        v >= 100000
                                            ? `${(v / 100000).toFixed(0)}L`
                                            : v >= 1000
                                              ? `${(v / 1000).toFixed(0)}K`
                                              : v
                                    }
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "var(--color-surface-2, #1a1a1a)",
                                        border: "1px solid var(--color-border, #444)",
                                        borderRadius: "8px",
                                        color: "var(--color-foreground, #fff)",
                                        fontSize: 12,
                                    }}
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    formatter={(value: any, name: any) => [
                                        `₹${Number(value).toLocaleString("en-IN")}`,
                                        name,
                                    ]}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: 12, color: "var(--color-foreground-secondary, #ccc)" }}
                                />
                                <Bar
                                    dataKey="expenses"
                                    fill="#a855f7"
                                    radius={[4, 4, 0, 0]}
                                    name="Expenses"
                                />
                                <Bar
                                    dataKey="procurement"
                                    fill="#3b82f6"
                                    radius={[4, 4, 0, 0]}
                                    name="Procurement"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-foreground-tertiary py-12 text-center">
                            No trend data available
                        </p>
                    )}
                </div>
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Buyer Summary */}
                <div className="bg-surface-1 rounded-lg border border-border-secondary p-5">
                    <h2 className="text-sm font-semibold text-foreground mb-4">
                        Buyer Summary
                    </h2>
                    {(data?.buyerSummary ?? []).length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border-secondary text-foreground-tertiary">
                                        <th className="text-left py-2 pr-3 font-medium">
                                            Buyer
                                        </th>
                                        <th className="text-right py-2 px-3 font-medium">
                                            Active
                                        </th>
                                        <th className="text-right py-2 px-3 font-medium">
                                            Total
                                        </th>
                                        <th className="text-right py-2 pl-3 font-medium">
                                            Paid
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data!.buyerSummary.map((b) => (
                                        <tr
                                            key={b.buyer_name}
                                            className="border-b border-border-secondary/50 last:border-0"
                                        >
                                            <td className="py-2 pr-3 text-foreground font-medium truncate max-w-[160px]">
                                                {b.buyer_name}
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums text-foreground-secondary">
                                                {b.active_orders}
                                            </td>
                                            <td className="py-2 px-3 text-right tabular-nums text-foreground-secondary">
                                                {b.total_orders}
                                            </td>
                                            <td className="py-2 pl-3 text-right tabular-nums text-foreground-secondary">
                                                {formatCurrency(b.total_paid)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-foreground-tertiary py-8 text-center">
                            No buyer data available
                        </p>
                    )}
                </div>

                {/* Delayed Orders */}
                <div className="bg-surface-1 rounded-lg border border-border-secondary p-5">
                    <h2 className="text-sm font-semibold text-foreground mb-4">
                        Delayed Orders
                        {(data?.delayedOrders ?? []).length > 0 && (
                            <span className="ml-2 text-xs font-normal text-red-400">
                                {data!.delayedOrders.length} order
                                {data!.delayedOrders.length !== 1 ? "s" : ""} past
                                shipping date
                            </span>
                        )}
                    </h2>
                    {(data?.delayedOrders ?? []).length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border-secondary text-foreground-tertiary">
                                        <th className="text-left py-2 pr-3 font-medium">
                                            Order
                                        </th>
                                        <th className="text-left py-2 px-3 font-medium">
                                            Buyer
                                        </th>
                                        <th className="text-left py-2 px-3 font-medium">
                                            Stage
                                        </th>
                                        <th className="text-right py-2 pl-3 font-medium">
                                            Delayed
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data!.delayedOrders.map((o) => (
                                        <tr
                                            key={o.id}
                                            className="border-b border-border-secondary/50 last:border-0"
                                        >
                                            <td className="py-2 pr-3 text-foreground font-medium text-xs">
                                                {o.order_no}
                                            </td>
                                            <td className="py-2 px-3 text-foreground-secondary truncate max-w-[120px]">
                                                {o.buyer}
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className="text-xs px-2 py-0.5 rounded bg-surface-2 text-foreground-secondary">
                                                    {STAGE_LABELS[o.stage] || o.stage}
                                                </span>
                                            </td>
                                            <td className="py-2 pl-3 text-right">
                                                <span
                                                    className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${riskBg(o.days_delayed)} ${riskColor(o.days_delayed)}`}
                                                >
                                                    {o.days_delayed}d
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-sm text-green-500 py-8 text-center">
                            No delayed orders
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

/** Merge expense and procurement trends into a single array keyed by month */
function buildTrendData(
    expenses: TrendItem[],
    procurement: TrendItem[]
): { month: string; expenses: number; procurement: number }[] {
    const map = new Map<string, { expenses: number; procurement: number }>();

    for (const e of expenses) {
        const label = formatMonthLabel(e.month);
        const existing = map.get(label) ?? { expenses: 0, procurement: 0 };
        existing.expenses = e.amount;
        map.set(label, existing);
    }
    for (const p of procurement) {
        const label = formatMonthLabel(p.month);
        const existing = map.get(label) ?? { expenses: 0, procurement: 0 };
        existing.procurement = p.amount;
        map.set(label, existing);
    }

    return Array.from(map.entries()).map(([month, vals]) => ({
        month,
        ...vals,
    }));
}
