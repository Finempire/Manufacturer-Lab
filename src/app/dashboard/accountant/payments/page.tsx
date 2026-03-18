"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditCard, Upload, X, ChevronRight, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import FileUpload from "@/components/FileUpload";

interface Purchase {
    id: string;
    purchase_no: string;
    request: { material_requirement_id: string; request_no: string; buyer: { name: string } };
    vendor: { name: string };
    invoice_no: string;
    invoice_date: string;
    invoice_amount: number;
    invoice_type_submitted: "PROVISIONAL" | "TAX";
    provisional_invoice_path: string | null;
    tax_invoice_path: string | null;
    status: string;
    amount_paid: number; // Derived or fetched in real app
}

export default function AccountantPaymentsPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);

    // Drawer state
    const [selectedPur, setSelectedPur] = useState<Purchase | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        payment_method: "BANK_TRANSFER",
        payment_date: new Date().toISOString().split("T")[0],
        amount_paid: "",
        reference_id: "",
        notes: "",
    });

    const [uploadedPath, setUploadedPath] = useState<string | null>(null);

    const loadData = useCallback(() => {
        setLoading(true);
        // Using INVOICE_SUBMITTED as the proxy for "needs payment" initially
        fetch("/api/purchases?status=INVOICE_SUBMITTED")
            .then(r => r.json())
            .then(data => setPurchases(data))
            .catch(() => toast.error("Failed to load purchases for payment"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const openDrawer = (pur: Purchase) => {
        setSelectedPur(pur);
        setFormData(prev => ({
            ...prev,
            amount_paid: pur.invoice_amount.toString()
        }));
        setUploadedPath(null);
    };

    const closeDrawer = () => {
        setSelectedPur(null);
        setUploadedPath(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPur) return;

        if (!uploadedPath) {
            toast.error("Payment proof document is required");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                purchase_id: selectedPur.id,
                payment_method: formData.payment_method,
                payment_date: formData.payment_date,
                amount_paid: parseFloat(formData.amount_paid),
                reference_id: formData.reference_id,
                payment_proof_path: uploadedPath,
                notes: formData.notes,
            };

            const res = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to record payment");

            toast.success("Payment recorded successfully!");
            closeDrawer();
            loadData();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to record payment");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Process Payments</h1>
                <p className="text-sm text-foreground-tertiary mt-1">Review invoices and upload payment proofs</p>
            </div>

            {loading ? (
                <div className="text-center py-12 text-foreground-tertiary">Loading...</div>
            ) : purchases.length === 0 ? (
                <div className="bg-surface-1 rounded-lg border border-border p-12 text-center">
                    <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-foreground-tertiary text-sm">No pending payments found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {purchases.map(pur => (
                        <div key={pur.id} className="bg-surface-1 border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-4 border-b border-border-secondary bg-surface-2 flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-foreground">{pur.purchase_no}</h3>
                                    <p className="text-xs text-foreground-tertiary mt-1">Ref: {pur.request?.request_no} • {pur.request?.buyer?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-blue-700">₹{pur.invoice_amount.toLocaleString()}</p>
                                    <p className="text-[10px] text-foreground-tertiary uppercase tracking-wider mt-0.5">{pur.invoice_type_submitted}</p>
                                </div>
                            </div>
                            <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs text-foreground-tertiary">Vendor</p>
                                        <p className="text-sm font-medium text-foreground">{pur.vendor.name}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <p className="text-xs text-foreground-tertiary">Invoice No</p>
                                            <p className="text-sm font-medium text-foreground">{pur.invoice_no}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-foreground-tertiary">Date</p>
                                            <p className="text-sm font-medium text-foreground">{format(new Date(pur.invoice_date), "dd MMM yyyy")}</p>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => openDrawer(pur)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap">
                                    <CreditCard className="w-4 h-4" /> Record Payment
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Backdrop overlay */}
            {selectedPur && (
                <div className="fixed inset-0 bg-black/40 z-[40] transition-opacity backdrop-blur-sm" onClick={closeDrawer} />
            )}

            {/* Right Side Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-xl bg-surface-1 shadow-2xl z-[50] transform transition-transform duration-300 ease-in-out flex flex-col ${selectedPur ? "translate-x-0" : "translate-x-full"}`}>
                {selectedPur && (
                    <>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary bg-surface-1">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Record Payment</h2>
                                <p className="text-xs text-foreground-tertiary">{selectedPur.purchase_no}</p>
                            </div>
                            <button onClick={closeDrawer} className="p-2 text-foreground-muted hover:text-foreground-secondary hover:bg-surface-3 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">

                                <div className="bg-surface-2 border border-border rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-foreground-tertiary">Vendor</span>
                                        <span className="font-bold text-foreground">{selectedPur.vendor.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-foreground-tertiary">Invoice Amount</span>
                                        <span className="font-bold text-blue-700">₹{selectedPur.invoice_amount.toLocaleString()}</span>
                                    </div>

                                    <div className="pt-3 flex gap-2 border-t border-border">
                                        {/* In real app, we'd use generateSignedUrl to preview. Using dummy alert for now */}
                                        <button type="button" onClick={() => window.open(`/api/files/${selectedPur.invoice_type_submitted === 'PROVISIONAL' ? selectedPur.provisional_invoice_path : selectedPur.tax_invoice_path}?action=inline`, '_blank')} className="flex-1 flex justify-center items-center gap-2 px-3 py-1.5 bg-surface-1 border border-border rounded text-xs font-medium text-foreground-secondary hover:bg-surface-2">
                                            <Eye className="w-3.5 h-3.5" /> View Invoice
                                        </button>
                                        <a href={`/api/files/${selectedPur.invoice_type_submitted === 'PROVISIONAL' ? selectedPur.provisional_invoice_path : selectedPur.tax_invoice_path}?action=download`} className="flex-1 flex justify-center items-center gap-2 px-3 py-1.5 bg-surface-1 border border-border rounded text-xs font-medium text-foreground-secondary hover:bg-surface-2">
                                            <Download className="w-3.5 h-3.5" /> Download
                                        </a>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Payment Method *</label>
                                        <select required className="w-full h-10 px-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}>
                                            <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                                            <option value="UPI">UPI</option>
                                            <option value="CASH">Cash</option>
                                            <option value="CHEQUE">Cheque</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Payment Date *</label>
                                        <input type="date" required className="w-full h-10 px-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Amount Paid (₹) *</label>
                                        <input type="number" required min="1" step="0.01" className="w-full h-10 px-3 border border-border rounded-lg text-sm text-right font-medium tabular-nums focus:ring-2 focus:ring-blue-500 bg-amber-50" value={formData.amount_paid} onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Reference/Txn ID</label>
                                        <input type="text" placeholder="e.g. UTR1234..." className="w-full h-10 px-3 border border-border rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500" value={formData.reference_id} onChange={(e) => setFormData({ ...formData, reference_id: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-foreground-secondary mb-1">Notes (Optional)</label>
                                    <textarea rows={2} className="w-full p-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" placeholder="Any internal notes regarding this payment..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                                </div>

                                <div className="pt-2">
                                    <label className="block text-xs font-bold text-foreground mb-2">Upload Payment Proof *</label>
                                    <FileUpload
                                        type="PAYMENT_PROOF"
                                        entityId={selectedPur.id}
                                        onUploadSuccess={(path) => setUploadedPath(path)}
                                    />
                                    <p className="text-[10px] text-foreground-tertiary mt-1">Requires screenshot of bank transfer, UPI summary, or photo of signed cheque/cash voucher.</p>
                                </div>

                            </form>
                        </div>

                        <div className="p-4 border-t border-border-secondary bg-surface-2 flex gap-3 pb-8 md:pb-4">
                            <button type="button" onClick={closeDrawer} className="flex-1 py-3 bg-surface-1 border border-border rounded-lg text-sm font-medium text-foreground-secondary hover:bg-surface-2 transition">
                                Cancel
                            </button>
                            <button type="submit" form="payment-form" disabled={submitting} className="flex-1 py-3 bg-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
                                {submitting ? "Processing..." : "Submit Payment"} <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
