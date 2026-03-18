"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, CheckCircle2, XCircle, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { SavedFilters } from "@/components/SavedFilters";
import ReminderButton from "@/components/ReminderButton";

interface Purchase {
    id: string;
    purchase_no: string;
    invoice_no: string;
    invoice_date: string;
    invoice_amount: number;
    invoice_type_submitted: string;
    provisional_invoice_path: string | null;
    tax_invoice_path: string | null;
    accountant_notes: string | null;
    status: string;
    created_at: string;
    vendor: { name: string };
    runner: { name: string };
    request: {
        request_no: string;
        manager: { name: string };
        buyer: { name: string };
    };
    lines: {
        id: string;
        quantity: number;
        rate: number;
        amount: number;
        material: { description: string; unit_of_measure: string } | null;
    }[];
}

const STATUS_COLORS: Record<string, string> = {
    INVOICE_SUBMITTED: "bg-amber-100 text-amber-800",
    APPROVED: "bg-green-100 text-green-800",
    PAID: "bg-blue-100 text-blue-800",
    PARTIALLY_PAID: "bg-indigo-100 text-indigo-800",
    PAID_PENDING_TAX_INVOICE: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-surface-3 text-foreground-secondary",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-surface-3 text-foreground-tertiary",
};

type TabKey = "PENDING" | "ALL";

export default function PurchasesReviewPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabKey>("PENDING");
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
    const [actionNotes, setActionNotes] = useState("");
    const [acting, setActing] = useState(false);
    const [vendorFilter, setVendorFilter] = useState("");
    const [filters, setFilters] = useState<Record<string, unknown>>({});

    const handleApplyFilter = (f: Record<string, unknown>) => {
        setFilters(f);
        if (f.vendor) setVendorFilter(f.vendor as string);
        else setVendorFilter("");
    };

    const loadPurchases = useCallback(() => {
        setLoading(true);
        const url = tab === "PENDING" ? "/api/purchases?status=INVOICE_SUBMITTED" : "/api/purchases";
        fetch(url)
            .then((r) => r.json())
            .then((data) => setPurchases(Array.isArray(data) ? data : []))
            .catch(() => toast.error("Failed to load purchases"))
            .finally(() => setLoading(false));
    }, [tab]);

    useEffect(() => { loadPurchases(); }, [loadPurchases]);

    const handleAction = async (purchaseId: string, action: "approve" | "reject") => {
        setActing(true);
        try {
            const res = await fetch(`/api/purchases/${purchaseId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: action === "approve" ? "APPROVED" : "REJECTED",
                    accountant_notes: actionNotes || null,
                }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success(`Purchase ${action === "approve" ? "approved" : "rejected"} successfully`);
            setSelectedPurchase(null);
            setActionNotes("");
            loadPurchases();
        } catch {
            toast.error(`Failed to ${action} purchase`);
        } finally {
            setActing(false);
        }
    };

    const tabs: { key: TabKey; label: string }[] = [
        { key: "PENDING", label: "Pending Review" },
        { key: "ALL", label: "All Purchases" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Purchases Review</h1>
                <p className="text-sm text-foreground-tertiary mt-1">Review and approve submitted purchase invoices</p>
            </div>

            {/* Tabs + Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <SavedFilters page="accountant-purchases" currentFilters={filters} onApplyFilter={handleApplyFilter} />
            </div>
            <div className="flex gap-1 bg-surface-3 p-1 rounded-lg w-fit">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                            tab === t.key ? "bg-surface-1 text-foreground shadow-sm" : "text-foreground-tertiary hover:text-foreground-secondary"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12 text-foreground-tertiary">Loading...</div>
            ) : purchases.length === 0 ? (
                <div className="bg-surface-1 rounded-lg border border-border p-12 text-center">
                    <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-foreground-tertiary text-sm">
                        {tab === "PENDING" ? "No purchases pending review" : "No purchases found"}
                    </p>
                </div>
            ) : (
                <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-surface-2">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-tertiary uppercase">Purchase #</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-tertiary uppercase">Request #</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-tertiary uppercase">Vendor</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-tertiary uppercase">Runner</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-tertiary uppercase">Invoice</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-foreground-tertiary uppercase">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-tertiary uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-tertiary uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-foreground-tertiary uppercase">Date</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-foreground-tertiary uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-secondary">
                                {purchases.map((p) => (
                                    <tr key={p.id} className="hover:bg-surface-2">
                                        <td className="px-4 py-3 text-sm font-medium text-foreground">{p.purchase_no}</td>
                                        <td className="px-4 py-3 text-sm text-foreground-secondary">{p.request?.request_no || "—"}</td>
                                        <td className="px-4 py-3 text-sm text-foreground-secondary">{p.vendor?.name}</td>
                                        <td className="px-4 py-3 text-sm text-foreground-secondary">{p.runner?.name}</td>
                                        <td className="px-4 py-3 text-sm text-foreground-secondary">{p.invoice_no}</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium tabular-nums">
                                            ₹{p.invoice_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-medium text-foreground-secondary">
                                                {p.invoice_type_submitted === "PROVISIONAL" ? "Provisional" : "Tax Invoice"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md ${STATUS_COLORS[p.status] || "bg-surface-3 text-foreground-secondary"}`}>
                                                {p.status.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-foreground-tertiary">{format(new Date(p.created_at), "dd MMM yyyy")}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => { setSelectedPurchase(p); setActionNotes(""); }}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detail / Action Modal */}
            {selectedPurchase && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-[40] backdrop-blur-sm" onClick={() => setSelectedPurchase(null)} />
                    <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-surface-1 shadow-2xl z-[50] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">{selectedPurchase.purchase_no}</h2>
                                <p className="text-xs text-foreground-tertiary">Invoice: {selectedPurchase.invoice_no}</p>
                            </div>
                            <button onClick={() => setSelectedPurchase(null)} className="p-2 text-foreground-muted hover:text-foreground-secondary hover:bg-surface-3 rounded-lg">
                                &times;
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-foreground-tertiary">Vendor</p><p className="text-sm font-medium">{selectedPurchase.vendor?.name}</p></div>
                                <div><p className="text-xs text-foreground-tertiary">Runner</p><p className="text-sm font-medium">{selectedPurchase.runner?.name}</p></div>
                                <div><p className="text-xs text-foreground-tertiary">Buyer</p><p className="text-sm font-medium">{selectedPurchase.request?.buyer?.name || "—"}</p></div>
                                <div><p className="text-xs text-foreground-tertiary">Requested By</p><p className="text-sm font-medium">{selectedPurchase.request?.manager?.name || "—"}</p></div>
                                <div><p className="text-xs text-foreground-tertiary">Invoice Date</p><p className="text-sm font-medium">{format(new Date(selectedPurchase.invoice_date), "dd MMM yyyy")}</p></div>
                                <div><p className="text-xs text-foreground-tertiary">Invoice Type</p><p className="text-sm font-medium">{selectedPurchase.invoice_type_submitted === "PROVISIONAL" ? "Provisional Slip" : "Tax Invoice"}</p></div>
                                <div><p className="text-xs text-foreground-tertiary">Invoice Amount</p><p className="text-sm font-bold text-foreground">₹{selectedPurchase.invoice_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></div>
                                <div><p className="text-xs text-foreground-tertiary">Status</p>
                                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md ${STATUS_COLORS[selectedPurchase.status] || "bg-surface-3 text-foreground-secondary"}`}>
                                        {selectedPurchase.status.replace(/_/g, " ")}
                                    </span>
                                </div>
                            </div>

                            {/* Invoice documents */}
                            {(selectedPurchase.provisional_invoice_path || selectedPurchase.tax_invoice_path) && (
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-2">Documents</h3>
                                    <div className="flex gap-3">
                                        {selectedPurchase.provisional_invoice_path && (
                                            <a href={`/api/files/${selectedPurchase.provisional_invoice_path}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-blue-600 hover:bg-surface-3 transition">
                                                <FileText className="w-4 h-4" /> Provisional Invoice
                                            </a>
                                        )}
                                        {selectedPurchase.tax_invoice_path && (
                                            <a href={`/api/files/${selectedPurchase.tax_invoice_path}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-2 border border-border rounded-lg text-sm text-blue-600 hover:bg-surface-3 transition">
                                                <FileText className="w-4 h-4" /> Tax Invoice
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Lines */}
                            {selectedPurchase.lines?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-2">Purchase Lines</h3>
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-surface-2">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-foreground-tertiary uppercase">Material</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-foreground-tertiary uppercase">Qty</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-foreground-tertiary uppercase">Rate</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-foreground-tertiary uppercase">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border-secondary">
                                            {selectedPurchase.lines.map((line) => (
                                                <tr key={line.id}>
                                                    <td className="px-3 py-2 text-sm text-foreground">{line.material?.description || "—"}</td>
                                                    <td className="px-3 py-2 text-sm text-right tabular-nums">{line.quantity}</td>
                                                    <td className="px-3 py-2 text-sm text-right tabular-nums">₹{line.rate.toFixed(2)}</td>
                                                    <td className="px-3 py-2 text-sm text-right font-medium tabular-nums">₹{line.amount.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Accountant Notes (if already noted) */}
                            {selectedPurchase.accountant_notes && (
                                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                                    <p className="text-xs font-bold text-yellow-800 mb-1">Accountant Notes</p>
                                    <p className="text-sm text-yellow-900">{selectedPurchase.accountant_notes}</p>
                                </div>
                            )}

                            {/* Action area - only for INVOICE_SUBMITTED */}
                            {selectedPurchase.status === "INVOICE_SUBMITTED" && (
                                <div className="space-y-3 pt-2 border-t border-border">
                                    <h3 className="text-sm font-semibold text-foreground">Review Action</h3>
                                    <textarea
                                        placeholder="Add notes (optional)..."
                                        className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        value={actionNotes}
                                        onChange={(e) => setActionNotes(e.target.value)}
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAction(selectedPurchase.id, "approve")}
                                            disabled={acting}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> {acting ? "Processing..." : "Approve"}
                                        </button>
                                        <button
                                            onClick={() => handleAction(selectedPurchase.id, "reject")}
                                            disabled={acting}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                                        >
                                            <XCircle className="w-4 h-4" /> {acting ? "Processing..." : "Reject"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
