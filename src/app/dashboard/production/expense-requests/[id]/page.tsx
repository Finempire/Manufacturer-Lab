"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";

interface ExpenseDetail {
    id: string;
    expense_no: string;
    expense_date: string;
    expense_category: string;
    description: string;
    vendor_name: string | null;
    expected_amount: number;
    actual_amount: number | null;
    attachment_path: string | null;
    status: string;
    raised_by: { name: string };
    buyer: { name: string };
    order: { order_no: string };
}

const STATUS_COLORS: Record<string, string> = {
    PENDING_APPROVAL: "bg-amber-50 text-amber-800 border-amber-200",
    APPROVED: "bg-blue-50 text-blue-800 border-blue-200",
    REJECTED: "bg-red-50 text-red-800 border-red-200",
    PAID: "bg-green-50 text-green-800 border-green-200",
};

export default function ProductionExpenseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [expense, setExpense] = useState<ExpenseDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/expenses/${params.id}`)
            .then(r => r.json())
            .then(data => { setExpense(data); setLoading(false); })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
    }, [params.id]);

    if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;
    if (!expense) return <div className="text-center py-12 text-slate-400">Not found</div>;

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900">{expense.expense_no}</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{expense.order.order_no} &bull; {expense.buyer.name}</p>
                </div>
                <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md border ${STATUS_COLORS[expense.status] || "bg-slate-100 text-slate-800 border-slate-200"}`}>
                    {expense.status.replace(/_/g, " ")}
                </span>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide border-b pb-2">Expense Details</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div><p className="text-xs text-slate-500 mb-1">Date</p><p className="text-sm font-medium">{format(new Date(expense.expense_date), "dd MMM yyyy")}</p></div>
                    <div><p className="text-xs text-slate-500 mb-1">Category</p><p className="text-sm font-medium">{expense.expense_category.replace(/_/g, " ")}</p></div>
                    <div><p className="text-xs text-slate-500 mb-1">Raised By</p><p className="text-sm font-medium">{expense.raised_by.name}</p></div>
                    <div><p className="text-xs text-slate-500 mb-1">Vendor</p><p className="text-sm font-medium">{expense.vendor_name || "—"}</p></div>
                    <div><p className="text-xs text-slate-500 mb-1">Expected Amount</p><p className="text-sm font-bold">₹{expense.expected_amount.toLocaleString("en-IN")}</p></div>
                    {expense.actual_amount && <div><p className="text-xs text-slate-500 mb-1">Actual Paid</p><p className="text-sm font-bold text-green-700">₹{expense.actual_amount.toLocaleString("en-IN")}</p></div>}
                    <div className="col-span-2"><p className="text-xs text-slate-500 mb-1">Description</p><p className="text-sm text-slate-700">{expense.description}</p></div>
                </div>
            </div>

            {expense.attachment_path && (
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-blue-500" /><span className="text-sm font-bold">Attachment</span></div>
                    <button onClick={() => window.open(`/api/files/${expense.attachment_path}?action=inline`, '_blank')} className="px-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100">View</button>
                </div>
            )}
        </div>
    );
}
