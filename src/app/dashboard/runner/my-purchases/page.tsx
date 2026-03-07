"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
    COMPLETED: "bg-gray-100 text-gray-600",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-500",
};

export default function MyPurchasesPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

    const loadPurchases = useCallback(() => {
        setLoading(true);
        fetch("/api/purchases")
            .then((r) => r.json())
            .then((data) => setPurchases(Array.isArray(data) ? data : []))
            .catch(() => toast.error("Failed to load purchases"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadPurchases(); }, [loadPurchases]);

    const totalAmount = purchases.reduce((sum, p) => sum + p.invoice_amount, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">My Purchases</h1>
                    <p className="text-sm text-gray-500 mt-1">View all purchases you have made</p>
                </div>
                {purchases.length > 0 && (
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Total Invoiced</p>
                        <p className="text-lg font-bold text-gray-900">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                    </div>
                )}
            </div>

            {/* Summary cards */}
            {purchases.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Total", count: purchases.length, color: "bg-gray-50 border-gray-200" },
                        { label: "Pending Review", count: purchases.filter(p => p.status === "INVOICE_SUBMITTED").length, color: "bg-amber-50 border-amber-200" },
                        { label: "Approved", count: purchases.filter(p => p.status === "APPROVED").length, color: "bg-green-50 border-green-200" },
                        { label: "Paid", count: purchases.filter(p => ["PAID", "PARTIALLY_PAID", "COMPLETED"].includes(p.status)).length, color: "bg-blue-50 border-blue-200" },
                    ].map((card) => (
                        <div key={card.label} className={`p-4 rounded-xl border ${card.color}`}>
                            <p className="text-2xl font-bold text-gray-900">{card.count}</p>
                            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : purchases.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">No purchases submitted yet</p>
                    <p className="text-gray-400 text-xs mt-1">When you submit purchase invoices, they will appear here</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase #</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request #</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">View</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {purchases.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.purchase_no}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{p.request?.request_no || "—"}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{p.vendor?.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{p.invoice_no}</td>
                                        <td className="px-4 py-3 text-sm text-right font-medium tabular-nums">
                                            ₹{p.invoice_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-medium text-gray-600">
                                                {p.invoice_type_submitted === "PROVISIONAL" ? "Provisional" : "Tax Invoice"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>
                                                {p.status.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(p.created_at), "dd MMM yyyy")}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setSelectedPurchase(p)}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detail Drawer */}
            {selectedPurchase && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-[40] backdrop-blur-sm" onClick={() => setSelectedPurchase(null)} />
                    <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[50] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{selectedPurchase.purchase_no}</h2>
                                <p className="text-xs text-gray-500">Invoice: {selectedPurchase.invoice_no}</p>
                            </div>
                            <button onClick={() => setSelectedPurchase(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                &times;
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-gray-500">Vendor</p><p className="text-sm font-medium">{selectedPurchase.vendor?.name}</p></div>
                                <div><p className="text-xs text-gray-500">Buyer</p><p className="text-sm font-medium">{selectedPurchase.request?.buyer?.name || "—"}</p></div>
                                <div><p className="text-xs text-gray-500">Invoice Date</p><p className="text-sm font-medium">{format(new Date(selectedPurchase.invoice_date), "dd MMM yyyy")}</p></div>
                                <div><p className="text-xs text-gray-500">Invoice Type</p><p className="text-sm font-medium">{selectedPurchase.invoice_type_submitted === "PROVISIONAL" ? "Provisional Slip" : "Tax Invoice"}</p></div>
                                <div><p className="text-xs text-gray-500">Invoice Amount</p><p className="text-sm font-bold text-gray-900">₹{selectedPurchase.invoice_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p></div>
                                <div><p className="text-xs text-gray-500">Status</p>
                                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md ${STATUS_COLORS[selectedPurchase.status] || "bg-gray-100 text-gray-600"}`}>
                                        {selectedPurchase.status.replace(/_/g, " ")}
                                    </span>
                                </div>
                            </div>

                            {/* Documents */}
                            {(selectedPurchase.provisional_invoice_path || selectedPurchase.tax_invoice_path) && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Documents</h3>
                                    <div className="flex gap-3">
                                        {selectedPurchase.provisional_invoice_path && (
                                            <a href={`/api/files/${selectedPurchase.provisional_invoice_path}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-blue-600 hover:bg-gray-100 transition">
                                                <FileText className="w-4 h-4" /> Provisional Invoice
                                            </a>
                                        )}
                                        {selectedPurchase.tax_invoice_path && (
                                            <a href={`/api/files/${selectedPurchase.tax_invoice_path}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-blue-600 hover:bg-gray-100 transition">
                                                <FileText className="w-4 h-4" /> Tax Invoice
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Purchase Lines */}
                            {selectedPurchase.lines?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Purchase Lines</h3>
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedPurchase.lines.map((line) => (
                                                <tr key={line.id}>
                                                    <td className="px-3 py-2 text-sm text-gray-900">{line.material?.description || "—"}</td>
                                                    <td className="px-3 py-2 text-sm text-right tabular-nums">{line.quantity}</td>
                                                    <td className="px-3 py-2 text-sm text-right tabular-nums">₹{line.rate.toFixed(2)}</td>
                                                    <td className="px-3 py-2 text-sm text-right font-medium tabular-nums">₹{line.amount.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Accountant Notes */}
                            {selectedPurchase.accountant_notes && (
                                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                                    <p className="text-xs font-bold text-yellow-800 mb-1">Accountant Notes</p>
                                    <p className="text-sm text-yellow-900">{selectedPurchase.accountant_notes}</p>
                                </div>
                            )}

                            {/* Status-specific messages */}
                            {selectedPurchase.status === "REJECTED" && (
                                <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                                    <p className="text-sm font-bold text-red-800">This purchase was rejected by the accountant.</p>
                                    <p className="text-xs text-red-700 mt-1">Please review the notes above and resubmit if needed.</p>
                                </div>
                            )}
                            {selectedPurchase.status === "PAID_PENDING_TAX_INVOICE" && (
                                <div className="p-3 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                                    <p className="text-sm font-bold text-purple-800">Payment processed. Tax invoice is pending.</p>
                                    <p className="text-xs text-purple-700 mt-1">Please upload the final tax invoice from the vendor.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
