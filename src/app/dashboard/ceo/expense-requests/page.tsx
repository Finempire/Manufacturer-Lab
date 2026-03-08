"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Receipt } from "lucide-react";
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
    PENDING_APPROVAL: "bg-amber-100 text-amber-800", APPROVED: "bg-blue-100 text-blue-800",
    REJECTED: "bg-red-100 text-red-800", PAID: "bg-green-100 text-green-800",
    COMPLETED: "bg-green-100 text-green-800",
};

export default function CEOExpenseRequestsPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        fetch("/api/expenses")
            .then(r => r.json())
            .then(data => { setExpenses(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
    }, []);

    const filtered = filter === "ALL" ? expenses : expenses.filter(e => e.status === filter);
    const totalAmount = filtered.reduce((s, e) => s + e.expected_amount, 0);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">Expense Requests</h1>
                <p className="text-sm text-slate-500 mt-1">{expenses.length} total &bull; ₹{totalAmount.toLocaleString("en-IN")} expected</p>
            </div>

            <div className="flex gap-2 flex-wrap">
                {["ALL", "PENDING_APPROVAL", "APPROVED", "PAID", "REJECTED"].map(s => (
                    <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${filter === s ? "bg-gray-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                        {s === "ALL" ? "All" : s.replace(/_/g, " ")}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Expense No</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Raised By</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Order</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center">
                                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">No expense requests</p>
                            </td></tr>
                        ) : filtered.map(exp => (
                            <tr key={exp.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{exp.expense_no}</td>
                                <td className="px-4 py-3 text-sm text-slate-500">{format(new Date(exp.expense_date), "dd MMM yyyy")}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{exp.expense_category.replace(/_/g, " ")}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{exp.raised_by.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{exp.order.order_no}</td>
                                <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium tabular-nums">₹{exp.expected_amount.toLocaleString("en-IN")}</td>
                                <td className="px-4 py-3"><span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${STATUS_COLORS[exp.status] || "bg-slate-100 text-slate-800"}`}>{exp.status.replace(/_/g, " ")}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
