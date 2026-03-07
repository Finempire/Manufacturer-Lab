"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, XCircle, CreditCard, FileText } from "lucide-react";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";

interface ExpenseDetail {
    id: string;
    expense_no: string;
    expense_date: string;
    expense_category: string;
    job_work_type: string | null;
    description: string;
    vendor_name: string | null;
    expected_amount: number;
    actual_amount: number | null;
    attachment_path: string | null;
    payment_method: string | null;
    payment_date: string | null;
    payment_reference: string | null;
    payment_proof_path: string | null;
    accountant_notes: string | null;
    rejection_reason: string | null;
    status: string;
    raised_by: { name: string };
    buyer: { name: string };
    order: { order_no: string };
    style: { style_code: string; style_name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
    PENDING_APPROVAL: "bg-amber-50 text-amber-800 border-amber-200",
    APPROVED: "bg-blue-50 text-blue-800 border-blue-200",
    REJECTED: "bg-red-50 text-red-800 border-red-200",
    PENDING_PAYMENT: "bg-orange-50 text-orange-800 border-orange-200",
    PAID: "bg-green-50 text-green-800 border-green-200",
    COMPLETED: "bg-green-50 text-green-800 border-green-200",
};

export default function AccountantExpenseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [expense, setExpense] = useState<ExpenseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [action, setAction] = useState<"approve" | "reject" | "pay" | null>(null);
    const [notes, setNotes] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
    const [paymentRef, setPaymentRef] = useState("");
    const [actualAmount, setActualAmount] = useState("");
    const [paymentProofPath, setPaymentProofPath] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetch(`/api/expenses/${params.id}`)
            .then(r => r.json())
            .then(data => { setExpense(data); setActualAmount(String(data.expected_amount)); setLoading(false); })
            .catch(() => { toast.error("Failed to load expense"); setLoading(false); });
    }, [params.id]);

    const handleApprove = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/expenses/${params.id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "APPROVED", accountant_notes: notes }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Expense approved");
            const updated = await fetch(`/api/expenses/${params.id}`).then(r => r.json());
            setExpense(updated); setAction(null);
        } catch { toast.error("Failed to approve"); }
        finally { setSubmitting(false); }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) { toast.error("Please provide a rejection reason"); return; }
        setSubmitting(true);
        try {
            const res = await fetch(`/api/expenses/${params.id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "REJECTED", rejection_reason: rejectReason }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Expense rejected");
            const updated = await fetch(`/api/expenses/${params.id}`).then(r => r.json());
            setExpense(updated); setAction(null);
        } catch { toast.error("Failed to reject"); }
        finally { setSubmitting(false); }
    };

    const handlePay = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`/api/expenses/${params.id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "PAID",
                    actual_amount: parseFloat(actualAmount),
                    payment_method: paymentMethod,
                    payment_reference: paymentRef,
                    payment_proof_path: paymentProofPath,
                    payment_date: new Date().toISOString(),
                }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Payment recorded");
            const updated = await fetch(`/api/expenses/${params.id}`).then(r => r.json());
            setExpense(updated); setAction(null);
        } catch { toast.error("Failed to record payment"); }
        finally { setSubmitting(false); }
    };

    if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
    if (!expense) return <div className="text-center py-12 text-gray-400">Expense not found</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900">{expense.expense_no}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{expense.order.order_no} &bull; {expense.buyer.name}</p>
                </div>
                <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md border ${STATUS_COLORS[expense.status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
                    {expense.status.replace(/_/g, " ")}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Details */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide border-b pb-2">Expense Details</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                            <div><p className="text-xs text-gray-500 mb-1">Date</p><p className="text-sm font-medium">{format(new Date(expense.expense_date), "dd MMM yyyy")}</p></div>
                            <div><p className="text-xs text-gray-500 mb-1">Category</p><p className="text-sm font-medium">{expense.expense_category.replace(/_/g, " ")}</p></div>
                            <div><p className="text-xs text-gray-500 mb-1">Raised By</p><p className="text-sm font-medium">{expense.raised_by.name}</p></div>
                            <div><p className="text-xs text-gray-500 mb-1">Vendor</p><p className="text-sm font-medium">{expense.vendor_name || "—"}</p></div>
                            {expense.style && <div><p className="text-xs text-gray-500 mb-1">Style</p><p className="text-sm font-medium">{expense.style.style_code}</p></div>}
                            {expense.job_work_type && <div><p className="text-xs text-gray-500 mb-1">Job Work Type</p><p className="text-sm font-medium">{expense.job_work_type}</p></div>}
                            <div className="col-span-2"><p className="text-xs text-gray-500 mb-1">Description</p><p className="text-sm text-gray-700">{expense.description}</p></div>
                        </div>
                    </div>

                    {/* Financials */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col sm:flex-row">
                        <div className="flex-1 p-5 border-b sm:border-b-0 sm:border-r border-gray-100 bg-slate-50">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Expected Amount</p>
                            <p className="text-2xl font-bold text-gray-900">₹{expense.expected_amount.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="flex-1 p-5 bg-blue-50/30">
                            <p className="text-xs text-blue-600 uppercase tracking-wider font-bold mb-1">Actual Paid</p>
                            <p className="text-2xl font-bold text-blue-700">{expense.actual_amount ? `₹${expense.actual_amount.toLocaleString("en-IN")}` : "—"}</p>
                            {expense.payment_method && <p className="text-xs text-gray-500 mt-1">Method: {expense.payment_method}</p>}
                        </div>
                    </div>

                    {/* Rejection reason */}
                    {expense.rejection_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <p className="text-xs text-red-600 font-bold uppercase mb-1">Rejection Reason</p>
                            <p className="text-sm text-red-800">{expense.rejection_reason}</p>
                        </div>
                    )}

                    {/* Documents */}
                    {(expense.attachment_path || expense.payment_proof_path) && (
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Documents</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {expense.attachment_path && (
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium">Attachment</span></div>
                                        <button onClick={() => window.open(`/api/files/${expense.attachment_path}?action=inline`, '_blank')} className="w-full py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded hover:bg-gray-100">View</button>
                                    </div>
                                )}
                                {expense.payment_proof_path && (
                                    <div className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2"><CreditCard className="w-4 h-4 text-green-500" /><span className="text-sm font-medium">Payment Proof</span></div>
                                        <button onClick={() => window.open(`/api/files/${expense.payment_proof_path}?action=inline`, '_blank')} className="w-full py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded hover:bg-gray-100">View</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Actions */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Actions</h4>

                        {expense.status === "PENDING_APPROVAL" && action === null && (
                            <>
                                <button onClick={() => setAction("approve")} className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition">
                                    <CheckCircle className="w-4 h-4" /> Approve
                                </button>
                                <button onClick={() => setAction("reject")} className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-red-600 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-50 transition">
                                    <XCircle className="w-4 h-4" /> Reject
                                </button>
                            </>
                        )}

                        {action === "approve" && (
                            <div className="space-y-2">
                                <textarea placeholder="Notes (optional)" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
                                <div className="flex gap-2">
                                    <button onClick={() => setAction(null)} className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                                    <button onClick={handleApprove} disabled={submitting} className="flex-1 py-2 text-sm text-white bg-green-600 rounded-lg disabled:opacity-50">{submitting ? "..." : "Confirm"}</button>
                                </div>
                            </div>
                        )}

                        {action === "reject" && (
                            <div className="space-y-2">
                                <textarea placeholder="Rejection reason *" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                                <div className="flex gap-2">
                                    <button onClick={() => setAction(null)} className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                                    <button onClick={handleReject} disabled={submitting} className="flex-1 py-2 text-sm text-white bg-red-600 rounded-lg disabled:opacity-50">{submitting ? "..." : "Reject"}</button>
                                </div>
                            </div>
                        )}

                        {(expense.status === "APPROVED" || expense.status === "PENDING_PAYMENT") && action === null && (
                            <button onClick={() => setAction("pay")} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
                                <CreditCard className="w-4 h-4" /> Record Payment
                            </button>
                        )}

                        {action === "pay" && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Actual Amount</label>
                                    <input type="number" step="0.01" className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm" value={actualAmount} onChange={e => setActualAmount(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                                    <select className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CASH">Cash</option>
                                        <option value="CHEQUE">Cheque</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Reference ID</label>
                                    <input type="text" className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Payment Proof</label>
                                    <FileUpload type="EXPENSE_PROOF" entityId={expense.id} onUploadSuccess={path => setPaymentProofPath(path)} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setAction(null)} className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                                    <button onClick={handlePay} disabled={submitting} className="flex-1 py-2 text-sm text-white bg-blue-600 rounded-lg disabled:opacity-50">{submitting ? "..." : "Submit"}</button>
                                </div>
                            </div>
                        )}

                        {expense.status === "PAID" && (
                            <div className="flex items-center gap-2 py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700">Paid</span>
                            </div>
                        )}
                    </div>

                    {expense.accountant_notes && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h4 className="text-sm font-bold text-gray-900 mb-2">Accountant Notes</h4>
                            <p className="text-sm text-gray-600">{expense.accountant_notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
