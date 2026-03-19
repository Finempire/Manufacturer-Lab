"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from "recharts";
import { Download, Filter, LayoutDashboard, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { toast } from "sonner";

// ─── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
    { id: "daily-petty-cash", label: "Daily Petty Cash" },
    { id: "vendor-wise", label: "Vendor Wise Purchases" },
    { id: "cogs", label: "Buyer & Order Cost (COGS)" },
    { id: "runner-performance", label: "Runner Boy Performance" },
    { id: "expense-report", label: "Expense Report" },
    { id: "style-wise", label: "Style-Wise Cost" },
    { id: "order-aging", label: "Order Aging" },
    { id: "stage-turnaround", label: "Stage Turnaround" },
    { id: "material-cycle-time", label: "Material Cycle Time" },
    { id: "pending-provisional", label: "Pending Provisional Invoice" },
    { id: "expense-approval-tat", label: "Expense Approval TAT" },
    { id: "production-lead-time", label: "Production Lead Time" },
    { id: "shipping-risk", label: "Shipping Risk" },
    { id: "audit-exception", label: "Audit Exception" },
    { id: "runner-performance-v2", label: "Runner Performance V2" },
];

// ─── Saved view persistence ─────────────────────────────────────────────────────
const SAVED_VIEW_KEY = "reports_saved_view";
interface SavedView {
    tab: string;
    startDate: string;
    endDate: string;
}

function loadSavedView(): SavedView | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(SAVED_VIEW_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function persistSavedView(view: SavedView) {
    localStorage.setItem(SAVED_VIEW_KEY, JSON.stringify(view));
}

function clearSavedView() {
    localStorage.removeItem(SAVED_VIEW_KEY);
}

// ─── Formatting helpers ─────────────────────────────────────────────────────────
function fmtCurrency(v: number | string): string {
    const n = typeof v === "string" ? parseFloat(v) : v;
    if (isNaN(n)) return "—";
    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(v: string | Date | null | undefined): string {
    if (!v) return "—";
    const d = typeof v === "string" ? new Date(v) : v;
    if (isNaN(d.getTime())) return String(v);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function daysColor(days: number | string): string {
    const n = typeof days === "string" ? parseFloat(days) : days;
    if (isNaN(n)) return "";
    if (n < 3) return "text-emerald-400";
    if (n <= 7) return "text-amber-400";
    return "text-red-400";
}

function agingBarColor(days: number): string {
    if (days <= 3) return "#22c55e";
    if (days <= 7) return "#f59e0b";
    if (days <= 14) return "#f97316";
    return "#ef4444";
}

// ─── Risk / Status badges ───────────────────────────────────────────────────────
const RISK_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    LOW: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    MEDIUM: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
    HIGH: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-400" },
    OVERDUE: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    COMPLETED: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
    PAID: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
    APPROVED: { bg: "bg-blue-500/10", text: "text-blue-400" },
    PENDING: { bg: "bg-amber-500/10", text: "text-amber-400" },
    PENDING_APPROVAL: { bg: "bg-amber-500/10", text: "text-amber-400" },
    PENDING_PAYMENT: { bg: "bg-amber-500/10", text: "text-amber-400" },
    PENDING_PURCHASE: { bg: "bg-amber-500/10", text: "text-amber-400" },
    REJECTED: { bg: "bg-red-500/10", text: "text-red-400" },
    CANCELLED: { bg: "bg-red-500/10", text: "text-red-400" },
    IN_PRODUCTION: { bg: "bg-indigo-500/10", text: "text-indigo-400" },
    PURCHASED: { bg: "bg-blue-500/10", text: "text-blue-400" },
    DRAFT: { bg: "bg-foreground-muted/10", text: "text-foreground-tertiary" },
};

function RiskBadge({ level }: { level: string }) {
    const c = RISK_COLORS[level] || { bg: "bg-surface-3", text: "text-foreground-secondary", dot: "bg-foreground-tertiary" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {level}
        </span>
    );
}

function StatusPill({ status }: { status: string }) {
    const s = String(status || "").toUpperCase().replace(/\s+/g, "_");
    const c = STATUS_COLORS[s] || { bg: "bg-surface-3", text: "text-foreground-secondary" };
    return (
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
            {String(status).replace(/_/g, " ")}
        </span>
    );
}

// ─── Chart color palette ────────────────────────────────────────────────────────
const CHART_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6"];
const PIE_RISK_COLORS: Record<string, string> = { LOW: "#22c55e", MEDIUM: "#f59e0b", HIGH: "#f97316", OVERDUE: "#ef4444" };

// ─── Column configuration per report ────────────────────────────────────────────
type ColType = "text" | "currency" | "date" | "days" | "hours" | "risk" | "status" | "number";

interface ColDef {
    key: string;
    label: string;
    type: ColType;
    align?: "left" | "right" | "center";
}

function getColumns(tab: string): ColDef[] | null {
    const map: Record<string, ColDef[]> = {
        "daily-petty-cash": [
            { key: "Date", label: "Date", type: "text" },
            { key: "Type", label: "Type", type: "text" },
            { key: "Ref", label: "Reference", type: "text" },
            { key: "Method", label: "Method", type: "text" },
            { key: "Amount_Out", label: "Amount", type: "currency", align: "right" },
        ],
        "vendor-wise": [
            { key: "vendor_name", label: "Vendor", type: "text" },
            { key: "styles", label: "Styles", type: "text" },
            { key: "total_invoices", label: "Invoices", type: "number", align: "right" },
            { key: "amount", label: "Total Amount", type: "currency", align: "right" },
            { key: "avg_value", label: "Avg Value", type: "currency", align: "right" },
            { key: "pending_tax_invoices", label: "Pending Tax", type: "number", align: "right" },
        ],
        "cogs": [
            { key: "buyer", label: "Buyer", type: "text" },
            { key: "order_no", label: "Order No", type: "text" },
            { key: "style", label: "Style", type: "text" },
            { key: "material_cost", label: "Material Cost", type: "currency", align: "right" },
            { key: "expense_cost", label: "Expense Cost", type: "currency", align: "right" },
            { key: "total_cost", label: "Total Cost", type: "currency", align: "right" },
        ],
        "runner-performance": [
            { key: "runner_name", label: "Runner", type: "text" },
            { key: "trips", label: "Trips", type: "number", align: "right" },
            { key: "amount_handled", label: "Amount Handled", type: "currency", align: "right" },
            { key: "avg_handled", label: "Avg / Trip", type: "currency", align: "right" },
            { key: "pending_confirmations", label: "Pending Confirm", type: "number", align: "right" },
            { key: "pending_tax_uploads", label: "Pending Tax", type: "number", align: "right" },
        ],
        "expense-report": [
            { key: "buyer", label: "Buyer", type: "text" },
            { key: "order_no", label: "Order No", type: "text" },
            { key: "category", label: "Category", type: "text" },
            { key: "description", label: "Description", type: "text" },
            { key: "vendor_payee", label: "Vendor / Payee", type: "text" },
            { key: "expected", label: "Expected", type: "currency", align: "right" },
            { key: "actual", label: "Actual", type: "currency", align: "right" },
            { key: "method", label: "Method", type: "text" },
            { key: "raised_by", label: "Raised By", type: "text" },
            { key: "status", label: "Status", type: "status" },
            { key: "date", label: "Date", type: "date" },
        ],
        "style-wise": [
            { key: "style_code", label: "Style Code", type: "text" },
            { key: "style_name", label: "Style Name", type: "text" },
            { key: "buyer", label: "Buyer", type: "text" },
            { key: "order_no", label: "Order No", type: "text" },
            { key: "material", label: "Material", type: "text" },
            { key: "qty_purchased", label: "Qty", type: "number", align: "right" },
            { key: "rate", label: "Rate", type: "currency", align: "right" },
            { key: "total_cost", label: "Total Cost", type: "currency", align: "right" },
            { key: "purchase_date", label: "Purchase Date", type: "date" },
            { key: "status", label: "Status", type: "status" },
        ],
        "order-aging": [
            { key: "order_no", label: "Order No", type: "text" },
            { key: "buyer", label: "Buyer", type: "text" },
            { key: "order_type", label: "Type", type: "text" },
            { key: "current_stage", label: "Stage", type: "status" },
            { key: "pending_since", label: "Pending Since", type: "date" },
            { key: "aging_days", label: "Aging Days", type: "days", align: "right" },
            { key: "blocker", label: "Blocker", type: "text" },
            { key: "next_action_owner", label: "Next Action", type: "text" },
        ],
        "stage-turnaround": [
            { key: "stage", label: "Stage", type: "text" },
            { key: "avg_hours", label: "Avg Hours", type: "hours", align: "right" },
            { key: "total_orders", label: "Orders", type: "number", align: "right" },
            { key: "avg_sample", label: "Avg Sample (hrs)", type: "hours", align: "right" },
            { key: "avg_production", label: "Avg Production (hrs)", type: "hours", align: "right" },
        ],
        "material-cycle-time": [
            { key: "order_no", label: "Order No", type: "text" },
            { key: "buyer", label: "Buyer", type: "text" },
            { key: "style", label: "Style", type: "text" },
            { key: "need_request_date", label: "Need Date", type: "date" },
            { key: "required_by", label: "Required By", type: "date" },
            { key: "completion_date", label: "Completed", type: "date" },
            { key: "cycle_time_days", label: "Cycle Days", type: "days", align: "right" },
            { key: "status", label: "Status", type: "status" },
        ],
        "pending-provisional": [
            { key: "purchase_no", label: "Purchase No", type: "text" },
            { key: "vendor", label: "Vendor", type: "text" },
            { key: "invoice_no", label: "Invoice No", type: "text" },
            { key: "invoice_date", label: "Invoice Date", type: "date" },
            { key: "amount", label: "Amount", type: "currency", align: "right" },
            { key: "runner", label: "Runner", type: "text" },
            { key: "days_pending", label: "Days Pending", type: "days", align: "right" },
            { key: "status", label: "Status", type: "status" },
        ],
        "expense-approval-tat": [
            { key: "expense_no", label: "Expense No", type: "text" },
            { key: "requester", label: "Requester", type: "text" },
            { key: "category", label: "Category", type: "text" },
            { key: "order_no", label: "Order No", type: "text" },
            { key: "style", label: "Style", type: "text" },
            { key: "expected_amount", label: "Amount", type: "currency", align: "right" },
            { key: "approval_tat_days", label: "Approval TAT", type: "days", align: "right" },
            { key: "payment_tat_days", label: "Payment TAT", type: "days", align: "right" },
            { key: "status", label: "Status", type: "status" },
        ],
        "production-lead-time": [
            { key: "order_no", label: "Order No", type: "text" },
            { key: "buyer", label: "Buyer", type: "text" },
            { key: "order_type", label: "Type", type: "text" },
            { key: "material_completed", label: "Material Done", type: "date" },
            { key: "production_completed", label: "Production Done", type: "date" },
            { key: "days_in_production", label: "Days in Production", type: "days", align: "right" },
            { key: "pm", label: "PM", type: "text" },
            { key: "status", label: "Status", type: "status" },
        ],
        "shipping-risk": [
            { key: "order_no", label: "Order No", type: "text" },
            { key: "buyer", label: "Buyer", type: "text" },
            { key: "shipping_date", label: "Ship Date", type: "date" },
            { key: "days_until_ship", label: "Days Until Ship", type: "days", align: "right" },
            { key: "current_stage", label: "Stage", type: "status" },
            { key: "risk_level", label: "Risk", type: "risk" },
            { key: "blocker", label: "Blocker", type: "text" },
        ],
        "audit-exception": [
            { key: "type", label: "Exception Type", type: "text" },
            { key: "reference", label: "Reference", type: "text" },
            { key: "date", label: "Date", type: "date" },
            { key: "reason", label: "Reason", type: "text" },
            { key: "by", label: "By", type: "text" },
        ],
        "runner-performance-v2": [
            { key: "runner_name", label: "Runner", type: "text" },
            { key: "assigned", label: "Assigned", type: "number", align: "right" },
            { key: "accepted", label: "Accepted", type: "number", align: "right" },
            { key: "completed", label: "Completed", type: "number", align: "right" },
            { key: "rejected", label: "Rejected", type: "number", align: "right" },
            { key: "provisional_pending_tax", label: "Pending Tax", type: "number", align: "right" },
            { key: "avg_completion_days", label: "Avg Days", type: "days", align: "right" },
        ],
    };
    return map[tab] || null;
}

// ─── Summary card computation ───────────────────────────────────────────────────
interface SummaryCard {
    label: string;
    value: string;
    sub?: string;
}

function computeSummary(tab: string, data: any[]): SummaryCard[] {
    if (!data || data.length === 0) return [];

    switch (tab) {
        case "daily-petty-cash": {
            const total = data.reduce((s, r) => s + (Number(r.Amount_Out) || 0), 0);
            const purchases = data.filter(r => r.Type === "Purchase Payment").length;
            const expenses = data.filter(r => r.Type === "Expense Payment").length;
            return [
                { label: "Total Entries", value: String(data.length) },
                { label: "Total Amount", value: fmtCurrency(total) },
                { label: "Purchase Payments", value: String(purchases) },
                { label: "Expense Payments", value: String(expenses) },
            ];
        }
        case "vendor-wise": {
            const totalAmt = data.reduce((s, r) => s + (Number(r.amount) || 0), 0);
            const totalInv = data.reduce((s, r) => s + (Number(r.total_invoices) || 0), 0);
            const pendingTax = data.reduce((s, r) => s + (Number(r.pending_tax_invoices) || 0), 0);
            return [
                { label: "Vendors", value: String(data.length) },
                { label: "Total Amount", value: fmtCurrency(totalAmt) },
                { label: "Total Invoices", value: String(totalInv) },
                { label: "Pending Tax Invoices", value: String(pendingTax) },
            ];
        }
        case "cogs": {
            const totalCost = data.reduce((s, r) => s + (Number(r.total_cost) || 0), 0);
            const matCost = data.reduce((s, r) => s + (Number(r.material_cost) || 0), 0);
            const expCost = data.reduce((s, r) => s + (Number(r.expense_cost) || 0), 0);
            return [
                { label: "Orders", value: String(data.length) },
                { label: "Total Cost", value: fmtCurrency(totalCost) },
                { label: "Material Cost", value: fmtCurrency(matCost) },
                { label: "Expense Cost", value: fmtCurrency(expCost) },
            ];
        }
        case "runner-performance": {
            const totalTrips = data.reduce((s, r) => s + (Number(r.trips) || 0), 0);
            const totalAmt = data.reduce((s, r) => s + (Number(r.amount_handled) || 0), 0);
            const pendConf = data.reduce((s, r) => s + (Number(r.pending_confirmations) || 0), 0);
            return [
                { label: "Runners", value: String(data.length) },
                { label: "Total Trips", value: String(totalTrips) },
                { label: "Total Handled", value: fmtCurrency(totalAmt) },
                { label: "Pending Confirms", value: String(pendConf) },
            ];
        }
        case "expense-report": {
            const totalExp = data.reduce((s, r) => s + (Number(r.expected) || 0), 0);
            const totalAct = data.reduce((s, r) => s + (Number(r.actual) || 0), 0);
            const paid = data.filter(r => r.status === "PAID").length;
            return [
                { label: "Expenses", value: String(data.length) },
                { label: "Total Expected", value: fmtCurrency(totalExp) },
                { label: "Total Actual", value: fmtCurrency(totalAct) },
                { label: "Paid", value: String(paid) },
            ];
        }
        case "style-wise": {
            const totalCost = data.reduce((s, r) => s + (Number(r.total_cost) || 0), 0);
            const styles = new Set(data.map(r => r.style_code)).size;
            return [
                { label: "Line Items", value: String(data.length) },
                { label: "Unique Styles", value: String(styles) },
                { label: "Total Cost", value: fmtCurrency(totalCost) },
            ];
        }
        case "order-aging": {
            const avgAging = data.length > 0 ? Math.round(data.reduce((s, r) => s + (Number(r.aging_days) || 0), 0) / data.length) : 0;
            const critical = data.filter(r => (Number(r.aging_days) || 0) > 14).length;
            return [
                { label: "Open Orders", value: String(data.length) },
                { label: "Avg Aging Days", value: String(avgAging) },
                { label: "Critical (>14d)", value: String(critical), sub: critical > 0 ? "Needs attention" : undefined },
            ];
        }
        case "stage-turnaround": {
            const totalOrders = data.reduce((s, r) => s + (Number(r.total_orders) || 0), 0);
            const avgAll = data.length > 0 ? Math.round(data.reduce((s, r) => s + (Number(r.avg_hours) || 0), 0) / data.length * 10) / 10 : 0;
            return [
                { label: "Stages Tracked", value: String(data.length) },
                { label: "Total Transitions", value: String(totalOrders) },
                { label: "Overall Avg Hours", value: String(avgAll) },
            ];
        }
        case "material-cycle-time": {
            const withCycle = data.filter(r => typeof r.cycle_time_days === "number");
            const avgCycle = withCycle.length > 0 ? Math.round(withCycle.reduce((s, r) => s + r.cycle_time_days, 0) / withCycle.length) : 0;
            const pending = data.filter(r => r.status !== "COMPLETED").length;
            return [
                { label: "Requirements", value: String(data.length) },
                { label: "Avg Cycle Days", value: String(avgCycle) },
                { label: "Pending", value: String(pending) },
            ];
        }
        case "pending-provisional": {
            const totalAmt = data.reduce((s, r) => s + (Number(r.amount) || 0), 0);
            const avgPending = data.length > 0 ? Math.round(data.reduce((s, r) => s + (Number(r.days_pending) || 0), 0) / data.length) : 0;
            return [
                { label: "Pending Invoices", value: String(data.length) },
                { label: "Total Amount", value: fmtCurrency(totalAmt) },
                { label: "Avg Days Pending", value: String(avgPending) },
            ];
        }
        case "expense-approval-tat": {
            const withTat = data.filter(r => typeof r.approval_tat_days === "number");
            const avgTat = withTat.length > 0 ? Math.round(withTat.reduce((s, r) => s + r.approval_tat_days, 0) / withTat.length * 10) / 10 : 0;
            const totalAmt = data.reduce((s, r) => s + (Number(r.expected_amount) || 0), 0);
            return [
                { label: "Expenses", value: String(data.length) },
                { label: "Avg Approval TAT", value: `${avgTat}d` },
                { label: "Total Amount", value: fmtCurrency(totalAmt) },
            ];
        }
        case "production-lead-time": {
            const avgDays = data.length > 0 ? Math.round(data.reduce((s, r) => s + (Number(r.days_in_production) || 0), 0) / data.length) : 0;
            const inProg = data.filter(r => r.production_completed === "In Progress").length;
            return [
                { label: "Orders", value: String(data.length) },
                { label: "Avg Lead Time", value: `${avgDays}d` },
                { label: "In Progress", value: String(inProg) },
            ];
        }
        case "shipping-risk": {
            const overdue = data.filter(r => r.risk_level === "OVERDUE").length;
            const high = data.filter(r => r.risk_level === "HIGH").length;
            const medium = data.filter(r => r.risk_level === "MEDIUM").length;
            const low = data.filter(r => r.risk_level === "LOW").length;
            return [
                { label: "Total Orders", value: String(data.length) },
                { label: "Overdue", value: String(overdue), sub: overdue > 0 ? "Immediate action" : undefined },
                { label: "High Risk", value: String(high) },
                { label: "Medium / Low", value: `${medium} / ${low}` },
            ];
        }
        case "audit-exception": {
            const types = new Map<string, number>();
            data.forEach(r => types.set(r.type, (types.get(r.type) || 0) + 1));
            const topType = Array.from(types.entries()).sort((a, b) => b[1] - a[1])[0];
            return [
                { label: "Total Exceptions", value: String(data.length) },
                { label: "Exception Types", value: String(types.size) },
                { label: "Most Common", value: topType ? topType[0] : "—", sub: topType ? `${topType[1]} items` : undefined },
            ];
        }
        case "runner-performance-v2": {
            const totalAssigned = data.reduce((s, r) => s + (Number(r.assigned) || 0), 0);
            const totalCompleted = data.reduce((s, r) => s + (Number(r.completed) || 0), 0);
            const totalRejected = data.reduce((s, r) => s + (Number(r.rejected) || 0), 0);
            const completionRate = totalAssigned > 0 ? Math.round(totalCompleted / totalAssigned * 100) : 0;
            return [
                { label: "Runners", value: String(data.length) },
                { label: "Total Assigned", value: String(totalAssigned) },
                { label: "Completion Rate", value: `${completionRate}%` },
                { label: "Total Rejected", value: String(totalRejected) },
            ];
        }
        default:
            return [{ label: "Records", value: String(data.length) }];
    }
}

// ─── Custom Recharts Tooltip ────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, isCurrency }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 shadow-premium-md">
            <p className="text-xs text-foreground-secondary mb-1">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="text-sm font-semibold text-foreground">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5" style={{ background: p.fill || p.color }} />
                    {p.name}: {isCurrency ? fmtCurrency(p.value) : typeof p.value === "number" ? p.value.toLocaleString() : p.value}
                </p>
            ))}
        </div>
    );
}

// ─── Chart container wrapper ────────────────────────────────────────────────────
function ChartContainer({ title, children, height = 280 }: { title: string; children: React.ReactNode; height?: number }) {
    return (
        <div className="mb-5 bg-surface-2 border border-border-secondary rounded-lg p-4">
            <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-wide mb-3">{title}</h3>
            <div style={{ height }}>{children}</div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState("vendor-wise");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSavedView, setHasSavedView] = useState(false);

    // Load saved view on mount
    useEffect(() => {
        const sv = loadSavedView();
        if (sv) {
            setActiveTab(sv.tab);
            setDateRange({ start: sv.startDate, end: sv.endDate });
            setHasSavedView(true);
        }
    }, []);

    const fetchReportData = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/api/reports?type=${activeTab}`;
            if (dateRange.start && dateRange.end) {
                url += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to load");
            const json = await res.json();

            if (activeTab === "daily-petty-cash") {
                const flattened = [
                    ...json.payments.map((p: any) => ({
                        Date: new Date(p.payment_date).toLocaleDateString(),
                        Type: "Purchase Payment",
                        Ref: p.purchase?.purchase_no || "-",
                        Method: p.payment_method,
                        Amount_Out: p.amount_paid
                    })),
                    ...json.expenses.map((e: any) => ({
                        Date: new Date(e.payment_date).toLocaleDateString(),
                        Type: "Expense Payment",
                        Ref: e.expense_no,
                        Method: e.payment_method,
                        Amount_Out: e.actual_amount
                    }))
                ].sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
                setData(flattened);
            } else {
                setData(json);
            }
        } catch {
            toast.error("Error loading report");
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [activeTab, dateRange.start, dateRange.end]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const handleExport = () => {
        exportToExcel(data, `Report_${activeTab.replace(/-/g, "_")}`);
    };

    const handleSaveView = () => {
        persistSavedView({ tab: activeTab, startDate: dateRange.start, endDate: dateRange.end });
        setHasSavedView(true);
        toast.success("View saved as default");
    };

    const handleClearView = () => {
        clearSavedView();
        setHasSavedView(false);
        toast.success("Saved view cleared");
    };

    const summaryCards = useMemo(() => computeSummary(activeTab, data), [activeTab, data]);

    // ─── Tab scrolling ──────────────────────────────────────────────────────────
    const scrollTabs = (dir: "left" | "right") => {
        const el = document.getElementById("report-tabs-scroll");
        if (el) el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    };

    // ─── Render chart ───────────────────────────────────────────────────────────
    const renderChart = () => {
        if (!data || data.length === 0) return null;

        const axisStyle = { fontSize: 11, fill: "var(--text-secondary)" };
        const gridStroke = "var(--border-secondary)";

        switch (activeTab) {
            case "vendor-wise":
                return (
                    <ChartContainer title="Vendor Purchase Volume">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.slice(0, 15)} layout="horizontal" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                <XAxis dataKey="vendor_name" tick={axisStyle} interval={0} angle={-20} textAnchor="end" height={60} />
                                <YAxis tick={axisStyle} />
                                <Tooltip content={<ChartTooltip isCurrency />} />
                                <Bar dataKey="amount" name="Amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                );

            case "cogs":
                return (
                    <ChartContainer title="Order Cost Breakdown">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.slice(0, 15)} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                <XAxis dataKey="order_no" tick={axisStyle} interval={0} angle={-20} textAnchor="end" height={60} />
                                <YAxis tick={axisStyle} />
                                <Tooltip content={<ChartTooltip isCurrency />} />
                                <Bar dataKey="material_cost" name="Material" fill="#6366f1" stackId="cost" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="expense_cost" name="Expense" fill="#f59e0b" stackId="cost" radius={[4, 4, 0, 0]} />
                                <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                );

            case "runner-performance":
                return (
                    <ChartContainer title="Runner Amount Handled">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                <XAxis dataKey="runner_name" tick={axisStyle} />
                                <YAxis tick={axisStyle} />
                                <Tooltip content={<ChartTooltip isCurrency />} />
                                <Bar dataKey="amount_handled" name="Amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                );

            case "expense-report": {
                const catMap = new Map<string, number>();
                data.forEach(r => {
                    const cat = r.category || "Other";
                    catMap.set(cat, (catMap.get(cat) || 0) + (Number(r.actual) || Number(r.expected) || 0));
                });
                const catData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
                return (
                    <ChartContainer title="Expense by Category">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={catData.slice(0, 12)} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                <XAxis dataKey="name" tick={axisStyle} interval={0} angle={-20} textAnchor="end" height={60} />
                                <YAxis tick={axisStyle} />
                                <Tooltip content={<ChartTooltip isCurrency />} />
                                <Bar dataKey="value" name="Amount" fill="#a855f7" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                );
            }

            case "order-aging": {
                const sorted = [...data].sort((a, b) => (Number(b.aging_days) || 0) - (Number(a.aging_days) || 0)).slice(0, 20);
                return (
                    <ChartContainer title="Order Aging (Days)" height={Math.max(280, sorted.length * 28)}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                                <XAxis type="number" tick={axisStyle} />
                                <YAxis type="category" dataKey="order_no" tick={axisStyle} width={75} />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="aging_days" name="Aging Days" radius={[0, 4, 4, 0]}>
                                    {sorted.map((entry, i) => (
                                        <Cell key={i} fill={agingBarColor(Number(entry.aging_days) || 0)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                );
            }

            case "stage-turnaround":
                return (
                    <ChartContainer title="Average Hours per Stage">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                <XAxis dataKey="stage" tick={axisStyle} interval={0} angle={-25} textAnchor="end" height={70} />
                                <YAxis tick={axisStyle} label={{ value: "Hours", angle: -90, position: "insideLeft", style: { fill: "var(--text-tertiary)", fontSize: 11 } }} />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="avg_sample" name="Sample" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="avg_production" name="Production" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                );

            case "shipping-risk": {
                const riskCounts = new Map<string, number>();
                data.forEach(r => riskCounts.set(r.risk_level, (riskCounts.get(r.risk_level) || 0) + 1));
                const pieData = Array.from(riskCounts.entries()).map(([name, value]) => ({ name, value }));
                return (
                    <ChartContainer title="Risk Level Distribution">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                    nameKey="name"
                                    label={(props: any) => `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                                    labelLine={{ stroke: "var(--text-tertiary)" }}
                                >
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={PIE_RISK_COLORS[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<ChartTooltip />} />
                                <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                );
            }

            case "runner-performance-v2":
                return (
                    <ChartContainer title="Assigned vs Completed per Runner">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                <XAxis dataKey="runner_name" tick={axisStyle} />
                                <YAxis tick={axisStyle} allowDecimals={false} />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="assigned" name="Assigned" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                );

            case "production-lead-time": {
                const chartData = [...data].sort((a, b) => (Number(b.days_in_production) || 0) - (Number(a.days_in_production) || 0)).slice(0, 15);
                return (
                    <ChartContainer title="Days in Production per Order">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                                <XAxis dataKey="order_no" tick={axisStyle} interval={0} angle={-20} textAnchor="end" height={60} />
                                <YAxis tick={axisStyle} label={{ value: "Days", angle: -90, position: "insideLeft", style: { fill: "var(--text-tertiary)", fontSize: 11 } }} />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="days_in_production" name="Days" fill="#14b8a6" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, i) => (
                                        <Cell key={i} fill={agingBarColor(Number(entry.days_in_production) || 0)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                );
            }

            default:
                return null;
        }
    };

    // ─── Render cell value ──────────────────────────────────────────────────────
    const renderCellValue = (row: any, col: ColDef) => {
        const val = row[col.key];
        if (val === null || val === undefined) return <span className="text-foreground-muted">—</span>;

        switch (col.type) {
            case "currency":
                return <span className="font-mono">{fmtCurrency(val)}</span>;
            case "date":
                return <span>{fmtDate(val)}</span>;
            case "days": {
                const n = typeof val === "number" ? val : parseFloat(val);
                if (isNaN(n)) return <span className="text-foreground-tertiary">{String(val)}</span>;
                return <span className={`font-mono font-semibold ${daysColor(n)}`}>{n}</span>;
            }
            case "hours": {
                const n = typeof val === "number" ? val : parseFloat(val);
                if (isNaN(n)) return <span className="text-foreground-tertiary">{String(val)}</span>;
                const hColor = n < 24 ? "text-emerald-400" : n <= 72 ? "text-amber-400" : "text-red-400";
                return <span className={`font-mono font-semibold ${hColor}`}>{n}</span>;
            }
            case "risk":
                return <RiskBadge level={String(val)} />;
            case "status":
                return <StatusPill status={String(val)} />;
            case "number":
                return <span className="font-mono">{typeof val === "number" ? val.toLocaleString() : val}</span>;
            default:
                return <span className="truncate max-w-[220px] inline-block">{String(val)}</span>;
        }
    };

    // ─── Render table ───────────────────────────────────────────────────────────
    const renderTable = () => {
        if (!data || data.length === 0) {
            return (
                <div className="py-16 text-center">
                    <p className="text-foreground-tertiary text-sm">No data found for this period</p>
                    <p className="text-foreground-muted text-xs mt-1">Try adjusting the date range or filters</p>
                </div>
            );
        }

        const columns = getColumns(activeTab);
        if (!columns) {
            const headers = Object.keys(data[0]);
            return (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-surface-2 border-y border-border text-xs uppercase font-bold text-foreground-tertiary sticky top-0 z-10">
                            <tr>
                                {headers.map(h => (
                                    <th key={h} className="px-4 py-3">{h.replace(/_/g, " ")}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-secondary">
                            {data.map((row, i) => (
                                <tr key={i} className="hover:bg-surface-3/50 transition-colors">
                                    {headers.map(h => (
                                        <td key={h} className="px-4 py-2.5 text-foreground">
                                            {typeof row[h] === "number" && (h.includes("amount") || h.includes("cost"))
                                                ? fmtCurrency(row[h])
                                                : row[h]?.toString()}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-surface-2 border-y border-border text-xs uppercase font-bold text-foreground-tertiary sticky top-0 z-10">
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-secondary">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-surface-3/50 transition-colors">
                                {columns.map(col => (
                                    <td
                                        key={col.key}
                                        className={`px-4 py-2.5 text-foreground ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                                    >
                                        {renderCellValue(row, col)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-5 max-w-[1400px] mx-auto">
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                        <LayoutDashboard className="w-5 h-5 text-brand" />
                        Analytical Reports
                    </h1>
                    <p className="text-sm text-foreground-tertiary mt-0.5">Export, filter, and track core business metrics</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Date range */}
                    <div className="flex items-center bg-surface-1 border border-border rounded-lg p-1.5">
                        <input
                            type="date"
                            className="text-xs px-2 py-1 outline-none bg-transparent text-foreground"
                            value={dateRange.start}
                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <span className="text-foreground-muted px-1">—</span>
                        <input
                            type="date"
                            className="text-xs px-2 py-1 outline-none bg-transparent text-foreground"
                            value={dateRange.end}
                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                        <button
                            onClick={fetchReportData}
                            className="ml-1.5 px-3 py-1 bg-brand/10 hover:bg-brand/20 text-brand rounded text-xs font-semibold flex items-center gap-1 transition"
                        >
                            <Filter className="w-3 h-3" /> Apply
                        </button>
                    </div>

                    {/* Save View */}
                    <button
                        onClick={hasSavedView ? handleClearView : handleSaveView}
                        className={`p-2 rounded-lg border transition text-xs font-semibold flex items-center gap-1.5 ${
                            hasSavedView
                                ? "bg-brand/10 border-brand/30 text-brand hover:bg-brand/20"
                                : "bg-surface-1 border-border text-foreground-secondary hover:bg-surface-3"
                        }`}
                        title={hasSavedView ? "Clear saved view" : "Save current view as default"}
                    >
                        {hasSavedView ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                        <span className="hidden sm:inline">{hasSavedView ? "Saved" : "Save View"}</span>
                    </button>
                </div>
            </div>

            {/* Main card */}
            <div className="bg-surface-1 rounded-xl border border-border overflow-hidden shadow-premium-sm">
                {/* Tab bar */}
                <div className="relative border-b border-border">
                    <button
                        onClick={() => scrollTabs("left")}
                        className="absolute left-0 top-0 bottom-0 z-20 w-8 flex items-center justify-center bg-gradient-to-r from-surface-1 to-transparent hover:from-surface-2"
                    >
                        <ChevronLeft className="w-4 h-4 text-foreground-tertiary" />
                    </button>
                    <div id="report-tabs-scroll" className="flex overflow-x-auto scrollbar-hide px-8">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                                    activeTab === tab.id
                                        ? "border-brand text-brand bg-brand/5"
                                        : "border-transparent text-foreground-tertiary hover:text-foreground-secondary hover:bg-surface-3/50"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => scrollTabs("right")}
                        className="absolute right-0 top-0 bottom-0 z-20 w-8 flex items-center justify-center bg-gradient-to-l from-surface-1 to-transparent hover:from-surface-2"
                    >
                        <ChevronRight className="w-4 h-4 text-foreground-tertiary" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Title + Export */}
                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-base font-bold text-foreground">{TABS.find(t => t.id === activeTab)?.label}</h2>
                        <button
                            onClick={handleExport}
                            disabled={data.length === 0}
                            className="flex items-center gap-2 bg-emerald-600/90 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-premium-sm hover:bg-emerald-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Download className="w-3.5 h-3.5" /> Export Excel
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-24 text-center">
                            <div className="inline-block w-6 h-6 border-2 border-brand/30 border-t-brand rounded-full animate-spin mb-3" />
                            <p className="text-foreground-tertiary text-sm">Running data aggregation...</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary cards */}
                            {summaryCards.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
                                    {summaryCards.map((card, i) => (
                                        <div key={i} className="bg-surface-2 border border-border-secondary rounded-lg px-4 py-3">
                                            <p className="text-xs text-foreground-tertiary font-medium uppercase tracking-wide">{card.label}</p>
                                            <p className="text-lg font-bold text-foreground mt-0.5">{card.value}</p>
                                            {card.sub && <p className="text-xs text-amber-400 mt-0.5">{card.sub}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Chart */}
                            {renderChart()}

                            {/* Table */}
                            <div className="border border-border rounded-lg overflow-hidden">
                                {renderTable()}
                            </div>

                            {/* Row count footer */}
                            {data.length > 0 && (
                                <p className="text-xs text-foreground-muted mt-3 text-right">
                                    Showing {data.length} record{data.length !== 1 ? "s" : ""}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
