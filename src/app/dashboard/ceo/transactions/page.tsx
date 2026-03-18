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
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">Transactions</h1>
                    <p className="text-sm text-foreground-tertiary mt-1">{payments.length} payments &bull; ₹{totalPaid.toLocaleString("en-IN")} total</p>
                </div>
            </div>

            <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-surface-2">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Purchase</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Vendor</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Method</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-foreground-tertiary uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Reference</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Accountant</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-secondary">
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-foreground-muted">Loading...</td></tr>
                        ) : payments.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center">
                                <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-foreground-tertiary">No transactions yet</p>
                            </td></tr>
                        ) : payments.map(p => (
                            <tr key={p.id} className="hover:bg-surface-2">
                                <td className="px-4 py-3 text-sm text-foreground-tertiary">{format(new Date(p.payment_date), "dd MMM yyyy")}</td>
                                <td className="px-4 py-3 text-sm font-medium text-foreground">{p.purchase.purchase_no}</td>
                                <td className="px-4 py-3 text-sm text-foreground-secondary">{p.purchase.vendor.name}</td>
                                <td className="px-4 py-3 text-sm text-foreground-secondary">{p.payment_method.replace(/_/g, " ")}</td>
                                <td className="px-4 py-3 text-sm font-medium text-foreground text-right tabular-nums">₹{p.amount_paid.toLocaleString("en-IN")}</td>
                                <td className="px-4 py-3 text-sm text-foreground-tertiary">{p.reference_id || "—"}</td>
                                <td className="px-4 py-3 text-sm text-foreground-secondary">{p.accountant.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
