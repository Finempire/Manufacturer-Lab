"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Receipt, Eye, Plus } from "lucide-react";
import { toast } from "sonner";

interface Expense {
    id: string;
    expense_no: string;
    expense_date: string;
    expense_category: string;
    expected_amount: number;
    status: string;
    order: { order_no: string };
}

const STATUS_COLORS: Record<string, string> = {
    PENDING_APPROVAL: "bg-amber-100 text-amber-800", APPROVED: "bg-blue-100 text-blue-800",
    REJECTED: "bg-red-100 text-red-800", PAID: "bg-green-100 text-green-800",
};

export default function SamplePMExpenseRequestsPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/expenses")
            .then(r => r.json())
            .then(data => { setExpenses(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">Expense Requests</h1>
                    <p className="text-sm text-foreground-tertiary mt-1">{expenses.length} requests</p>
                </div>
                <Link href="/dashboard/sample-pm/expense-requests/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> New Expense
                </Link>
            </div>

            <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-surface-2">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Expense No</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Order</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-foreground-tertiary uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-tertiary uppercase">View</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-secondary">
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-foreground-muted">Loading...</td></tr>
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center">
                                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-foreground-tertiary">No expense requests</p>
                            </td></tr>
                        ) : expenses.map(exp => (
                            <tr key={exp.id} className="hover:bg-surface-2">
                                <td className="px-4 py-3 text-sm font-semibold text-foreground">{exp.expense_no}</td>
                                <td className="px-4 py-3 text-sm text-foreground-tertiary">{format(new Date(exp.expense_date), "dd MMM yyyy")}</td>
                                <td className="px-4 py-3 text-sm text-foreground-secondary">{exp.expense_category.replace(/_/g, " ")}</td>
                                <td className="px-4 py-3 text-sm text-foreground-secondary">{exp.order.order_no}</td>
                                <td className="px-4 py-3 text-sm text-foreground text-right font-medium tabular-nums">₹{exp.expected_amount.toLocaleString("en-IN")}</td>
                                <td className="px-4 py-3"><span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${STATUS_COLORS[exp.status] || "bg-surface-3 text-foreground"}`}>{exp.status.replace(/_/g, " ")}</span></td>
                                <td className="px-4 py-3 text-center"><Link href={`/dashboard/sample-pm/expense-requests/${exp.id}`} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4 mx-auto" /></Link></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
