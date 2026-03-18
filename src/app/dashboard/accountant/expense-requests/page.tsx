"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Receipt, Eye, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { SavedFilters } from "@/components/SavedFilters";
import { DatePresets } from "@/components/DatePresets";
import { exportToExcel } from "@/lib/exportExcel";

interface Expense {
    id: string;
    expense_no: string;
    expense_date: string;
    expense_category: string;
    description: string;
    expected_amount: number;
    actual_amount: number | null;
    status: string;
    raised_by: { name: string };
    buyer: { name: string };
    order: { order_no: string };
}

const STATUS_COLORS: Record<string, string> = {
    PENDING_APPROVAL: "bg-amber-100 text-amber-800",
    APPROVED: "bg-blue-100 text-blue-800",
    REJECTED: "bg-red-100 text-red-800",
    PENDING_PAYMENT: "bg-orange-100 text-orange-800",
    PAID: "bg-green-100 text-green-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-surface-3 text-foreground",
};

export default function AccountantExpenseRequestsPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [datePreset, setDatePreset] = useState("");

    useEffect(() => {
        fetch("/api/expenses")
            .then(r => r.json())
            .then(data => { setExpenses(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { toast.error("Failed to load expenses"); setLoading(false); });
    }, []);

    const filtered = (filter === "ALL" ? expenses : expenses.filter(e => e.status === filter))
        .filter(e => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return e.expense_no.toLowerCase().includes(q) ||
                e.raised_by.name.toLowerCase().includes(q) ||
                e.buyer.name.toLowerCase().includes(q) ||
                e.order.order_no.toLowerCase().includes(q) ||
                e.expense_category.toLowerCase().includes(q);
        });

    const handleExport = () => {
        const exportData = filtered.map(e => ({
            "Expense No": e.expense_no,
            "Date": format(new Date(e.expense_date), "dd MMM yyyy"),
            "Category": e.expense_category.replace(/_/g, " "),
            "Raised By": e.raised_by.name,
            "Order": e.order.order_no,
            "Expected": e.expected_amount,
            "Actual": e.actual_amount || "",
            "Status": e.status.replace(/_/g, " "),
        }));
        exportToExcel(exportData, "Expense_Requests_Export");
    };

    const handleApplyFilter = (filters: Record<string, unknown>) => {
        setFilter((filters.status as string) || "ALL");
        setSearchQuery((filters.search as string) || "");
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">Expense Requests</h1>
                    <p className="text-sm text-foreground-tertiary mt-1">{filtered.length} of {expenses.length} requests</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExport} disabled={filtered.length === 0} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground-secondary bg-surface-1 border border-border rounded-md hover:bg-surface-2 disabled:opacity-50">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <Link href="/dashboard/accountant/expense-requests/new" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors">
                        <Plus className="w-4 h-4" /> New Expense
                    </Link>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-surface-1 rounded-lg border border-border p-3 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        type="text"
                        placeholder="Search expenses, orders, categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 px-3 text-sm border border-border rounded-md w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <div className="flex gap-1 flex-wrap">
                        {["ALL", "PENDING_APPROVAL", "APPROVED", "PENDING_PAYMENT", "PAID", "REJECTED"].map(s => (
                            <button key={s} onClick={() => setFilter(s)} className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${filter === s ? "bg-slate-900 text-white" : "bg-surface-3 text-foreground-secondary hover:bg-surface-3"}`}>
                                {s === "ALL" ? "All" : s.replace(/_/g, " ")}
                            </button>
                        ))}
                    </div>
                    <DatePresets onSelect={(from, to) => setDatePreset(from)} activePreset={datePreset} />
                </div>
                <SavedFilters
                    page="expenses"
                    currentFilters={{ status: filter, search: searchQuery }}
                    onApplyFilter={handleApplyFilter}
                />
            </div>

            <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-surface-2">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Expense No</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Raised By</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Order</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-foreground-tertiary uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-tertiary uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-secondary">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-foreground-muted">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-foreground-muted">
                                    <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    No expense requests found
                                </td></tr>
                            ) : filtered.map(exp => (
                                <tr key={exp.id} className="hover:bg-surface-2 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{exp.expense_no}</td>
                                    <td className="px-4 py-3 text-sm text-foreground-tertiary">{format(new Date(exp.expense_date), "dd MMM yyyy")}</td>
                                    <td className="px-4 py-3 text-sm text-foreground-secondary">{exp.expense_category.replace(/_/g, " ")}</td>
                                    <td className="px-4 py-3 text-sm text-foreground-secondary">{exp.raised_by.name}</td>
                                    <td className="px-4 py-3 text-sm text-foreground-secondary">{exp.order.order_no}</td>
                                    <td className="px-4 py-3 text-sm text-foreground text-right font-medium tabular-nums">₹{exp.expected_amount.toLocaleString("en-IN")}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${STATUS_COLORS[exp.status] || "bg-surface-3 text-foreground"}`}>
                                            {exp.status.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Link href={`/dashboard/accountant/expense-requests/${exp.id}`} className="text-blue-600 hover:text-blue-800">
                                            <Eye className="w-4 h-4 mx-auto" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
