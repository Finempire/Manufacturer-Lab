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
    buyer: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
    PENDING_APPROVAL: "bg-amber-100 text-amber-800", APPROVED: "bg-blue-100 text-blue-800",
    REJECTED: "bg-red-100 text-red-800", PAID: "bg-green-100 text-green-800",
};

export default function ProductionExpensesPage() {
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
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900">Expense Requests</h1>
                    <p className="text-sm text-slate-500 mt-1">{expenses.length} requests</p>
                </div>
                <Link href="/dashboard/production/expense-requests/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> New Expense
                </Link>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Expense No</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Order</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">View</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center">
                                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">No expense requests</p>
                            </td></tr>
                        ) : expenses.map(exp => (
                            <tr key={exp.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{exp.expense_no}</td>
                                <td className="px-4 py-3 text-sm text-slate-500">{format(new Date(exp.expense_date), "dd MMM yyyy")}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{exp.expense_category.replace(/_/g, " ")}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{exp.order.order_no}</td>
                                <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium tabular-nums">₹{exp.expected_amount.toLocaleString("en-IN")}</td>
                                <td className="px-4 py-3"><span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${STATUS_COLORS[exp.status] || "bg-slate-100 text-slate-800"}`}>{exp.status.replace(/_/g, " ")}</span></td>
                                <td className="px-4 py-3 text-center"><Link href={`/dashboard/production/expense-requests/${exp.id}`} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4 mx-auto" /></Link></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
