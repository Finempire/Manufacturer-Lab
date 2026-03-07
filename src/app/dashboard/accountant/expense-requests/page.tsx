"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Receipt, Eye, Plus, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

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
    CANCELLED: "bg-gray-100 text-gray-800",
};

export default function AccountantExpenseRequestsPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        fetch("/api/expenses")
            .then(r => r.json())
            .then(data => { setExpenses(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { toast.error("Failed to load expenses"); setLoading(false); });
    }, []);

    const filtered = filter === "ALL" ? expenses : expenses.filter(e => e.status === filter);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Expense Requests</h1>
                    <p className="text-sm text-gray-500 mt-1">{expenses.length} total requests</p>
                </div>
                <Link href="/dashboard/accountant/expense-requests/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> New Expense
                </Link>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {["ALL", "PENDING_APPROVAL", "APPROVED", "PENDING_PAYMENT", "PAID", "REJECTED"].map(s => (
                    <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${filter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        {s === "ALL" ? "All" : s.replace(/_/g, " ")}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Expense No</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Raised By</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">
                                    <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    No expense requests found
                                </td></tr>
                            ) : filtered.map(exp => (
                                <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{exp.expense_no}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(exp.expense_date), "dd MMM yyyy")}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{exp.expense_category.replace(/_/g, " ")}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{exp.raised_by.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{exp.order.order_no}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium tabular-nums">₹{exp.expected_amount.toLocaleString("en-IN")}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${STATUS_COLORS[exp.status] || "bg-gray-100 text-gray-800"}`}>
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
