"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";

interface Payment {
    id: string;
    payment_date: string;
    payment_method: string;
    amount_paid: number;
    reference_id: string | null;
    purchase: { purchase_no: string; vendor: { name: string }; invoice_amount: number };
    accountant: { name: string };
}

export default function CEOTransactionsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/payments")
            .then(r => r.json())
            .then(data => { setPayments(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
    }, []);

    const totalPaid = payments.reduce((s, p) => s + p.amount_paid, 0);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900">Transactions</h1>
                    <p className="text-sm text-slate-500 mt-1">{payments.length} payments &bull; ₹{totalPaid.toLocaleString("en-IN")} total</p>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Purchase</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Vendor</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Method</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Reference</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Accountant</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                        ) : payments.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center">
                                <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">No transactions yet</p>
                            </td></tr>
                        ) : payments.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm text-slate-500">{format(new Date(p.payment_date), "dd MMM yyyy")}</td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.purchase.purchase_no}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{p.purchase.vendor.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{p.payment_method.replace(/_/g, " ")}</td>
                                <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right tabular-nums">₹{p.amount_paid.toLocaleString("en-IN")}</td>
                                <td className="px-4 py-3 text-sm text-slate-500">{p.reference_id || "—"}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{p.accountant.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
