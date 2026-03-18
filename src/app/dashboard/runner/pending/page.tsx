"use client";

import { useState, useEffect, useCallback } from "react";
import { Truck, Upload, X, ChevronRight, AlertCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import FileUpload from "@/components/FileUpload";
import AddVendorModal from "@/components/AddVendorModal";
import { useColumnResize } from "@/hooks/useColumnResize";

interface Request {
    id: string;
    request_no: string;
    manager: { name: string };
    buyer: { name: string };
    store_location: string;
    expected_date: string;
    remarks: string | null;
    preferred_vendor: { id: string; name: string } | null;
    lines: {
        id: string;
        material: { id: string; description: string; unit_of_measure: string };
        quantity: number;
        expected_rate: number;
        expected_amount: number;
    }[];
}

interface Vendor { id: string; name: string; }
interface PurchaseLine {
    material_id: string;
    material_name: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
}

const INITIAL_COL_WIDTHS = { material: 100, description: 180, qty: 80, rate: 100, amount: 110 };

export default function PendingPurchasesPage() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);

    // Drawer state
    const [selectedReq, setSelectedReq] = useState<Request | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showVendorModal, setShowVendorModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        vendor_id: "",
        invoice_no: "",
        invoice_date: new Date().toISOString().split("T")[0],
        invoice_type_submitted: "PROVISIONAL",
        invoice_amount: "",
    });

    // Purchase lines state
    const [purchaseLines, setPurchaseLines] = useState<PurchaseLine[]>([]);
    const { widths, startResize } = useColumnResize(INITIAL_COL_WIDTHS);

    // The relative path returned from the FileUpload component
    const [uploadedPath, setUploadedPath] = useState<string | null>(null);

    const loadData = useCallback(() => {
        setLoading(true);
        Promise.all([
            fetch("/api/material-requests?status=PENDING_PURCHASE").then(r => r.json()),
            fetch("/api/master/vendors").then(r => r.json())
        ])
            .then(([reqs, vends]) => {
                setRequests(reqs);
                setVendors(vends);
            })
            .catch(() => toast.error("Failed to load pending requests"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const openDrawer = (req: Request) => {
        setSelectedReq(req);
        setFormData(prev => ({
            ...prev,
            vendor_id: req.preferred_vendor?.id || "",
            invoice_amount: req.lines.reduce((s, l) => s + l.expected_amount, 0).toString()
        }));
        // Initialize purchase lines from request lines
        setPurchaseLines(req.lines.map(l => ({
            material_id: l.material.id,
            material_name: l.material.description,
            description: "",
            quantity: l.quantity,
            rate: l.expected_rate,
            amount: l.expected_amount,
        })));
        setUploadedPath(null);
    };

    const closeDrawer = () => {
        setSelectedReq(null);
        setUploadedPath(null);
        setPurchaseLines([]);
    };

    const handleLineChange = (index: number, field: string, value: string | number) => {
        const newLines = [...purchaseLines];
        newLines[index] = { ...newLines[index], [field]: value };
        if (field === "quantity" || field === "rate") {
            newLines[index].amount = Number(newLines[index].quantity) * Number(newLines[index].rate);
        }
        setPurchaseLines(newLines);
        // Update total invoice amount
        const total = newLines.reduce((s, l) => s + l.amount, 0);
        setFormData(prev => ({ ...prev, invoice_amount: total.toString() }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedReq) return;

        if (!uploadedPath) {
            toast.error(`${formData.invoice_type_submitted === 'PROVISIONAL' ? 'Provisional slip' : 'Tax invoice'} document is required`);
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                request_id: selectedReq.id,
                vendor_id: formData.vendor_id,
                invoice_no: formData.invoice_no,
                invoice_date: formData.invoice_date,
                invoice_amount: parseFloat(formData.invoice_amount),
                invoice_type_submitted: formData.invoice_type_submitted,
                [formData.invoice_type_submitted === "PROVISIONAL" ? "provisional_invoice_path" : "tax_invoice_path"]: uploadedPath,
                lines: purchaseLines.map(l => ({
                    material_id: l.material_id,
                    quantity: l.quantity,
                    rate: l.rate,
                    amount: l.amount,
                }))
            };

            const res = await fetch("/api/purchases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to submit purchase invoice");

            toast.success("Purchase invoice submitted successfully!");
            closeDrawer();
            loadData();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to submit purchase");
        } finally {
            setSubmitting(false);
        }
    };

    const ResizeHandle = ({ colKey }: { colKey: string }) => (
        <div
            onMouseDown={(e) => startResize(colKey, e)}
            style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "4px", cursor: "col-resize", userSelect: "none", background: "transparent" }}
            className="hover:bg-blue-400 active:bg-blue-400 transition-colors"
        />
    );

    const linesTotalAmount = purchaseLines.reduce((s, l) => s + l.amount, 0);

    return (
        <div className="space-y-6 pb-4">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Pending Purchases</h1>
                <p className="text-sm text-foreground-tertiary mt-1">Material requests assigned to you for purchase</p>
            </div>

            {loading ? (
                <div className="text-center py-12 text-foreground-tertiary">Loading...</div>
            ) : requests.length === 0 ? (
                <div className="bg-surface-1 rounded-lg border border-border p-12 text-center">
                    <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-foreground-tertiary text-sm">No pending purchases assigned</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {requests.map(req => (
                        <div key={req.id} className="bg-surface-1 border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-4 border-b border-border-secondary bg-surface-2 flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-foreground">{req.request_no}</h3>
                                    <p className="text-xs text-foreground-tertiary mt-1">{req.buyer.name}</p>
                                </div>
                                <span className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md bg-amber-100 text-amber-800">
                                    Pending
                                </span>
                            </div>
                            <div className="p-4 space-y-3">
                                <div>
                                    <p className="text-xs text-foreground-tertiary mb-0.5">Deliver to</p>
                                    <p className="text-sm font-medium text-foreground">{req.store_location}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-foreground-tertiary mb-0.5">Expected Due</p>
                                    <p className="text-sm font-medium text-foreground">{format(new Date(req.expected_date), "dd MMM yyyy")}</p>
                                </div>
                                {req.preferred_vendor && (
                                    <div className="p-2.5 bg-blue-50 rounded text-xs text-blue-800 border-l-2 border-blue-400 min-h-[44px] flex items-center">
                                        <div>
                                            <span className="font-bold block mb-0.5">Preferred Vendor:</span>
                                            {req.preferred_vendor.name}
                                        </div>
                                    </div>
                                )}
                                <div className="mt-4 pt-4 border-t border-border-secondary border-dashed">
                                    <p className="text-xs text-center text-foreground-tertiary mb-2">{req.lines.length} items to purchase</p>
                                    <button onClick={() => openDrawer(req)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-[0.97] transition-all min-h-[48px]">
                                        <Upload className="w-5 h-5" /> Upload Invoice
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Backdrop overlay */}
            {selectedReq && (
                <div className="fixed inset-0 bg-black/40 z-[40] transition-opacity backdrop-blur-sm" onClick={closeDrawer} />
            )}

            {/* Right Side Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-surface-1 shadow-2xl z-[50] transform transition-transform duration-300 ease-in-out flex flex-col ${selectedReq ? "translate-x-0" : "translate-x-full"}`}>
                {selectedReq && (
                    <>
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary bg-surface-1">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Submit Purchase Info</h2>
                                <p className="text-xs text-foreground-tertiary">{selectedReq.request_no}</p>
                            </div>
                            <button onClick={closeDrawer} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground-muted hover:text-foreground-secondary hover:bg-surface-3 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <form id="purchase-form" onSubmit={handleSubmit} className="space-y-6">

                                {selectedReq.preferred_vendor && (
                                    <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-blue-900">Store Manager preferred:</p>
                                            <p className="text-xs text-blue-800">{selectedReq.preferred_vendor.name} — you may change if needed</p>
                                        </div>
                                    </div>
                                )}

                                {/* Row 1: Actual Vendor */}
                                <div>
                                    <label className="block text-xs font-medium text-foreground-secondary mb-1">Actual Vendor *</label>
                                    <select
                                        required
                                        className="w-full h-11 md:h-10 px-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        value={formData.vendor_id}
                                        onChange={(e) => {
                                            if (e.target.value === "ADD_NEW") setShowVendorModal(true);
                                            else setFormData({ ...formData, vendor_id: e.target.value });
                                        }}
                                    >
                                        <option value="">Select Vendor</option>
                                        {vendors.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
                                        <option value="ADD_NEW" className="text-blue-600 font-bold">+ Add New Vendor</option>
                                    </select>
                                </div>

                                {/* Row 2: Invoice No | Invoice Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Invoice Number *</label>
                                        <input type="text" required placeholder="e.g. INV-123" className="w-full h-11 md:h-10 px-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.invoice_no} onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Invoice Date *</label>
                                        <input type="date" required className="w-full h-11 md:h-10 px-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} />
                                    </div>
                                </div>

                                {/* Row 3: Invoice Type | Total Amount */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Invoice Type *</label>
                                        <select required className="w-full h-11 md:h-10 px-3 border border-border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.invoice_type_submitted} onChange={(e) => setFormData({ ...formData, invoice_type_submitted: e.target.value })}>
                                            <option value="PROVISIONAL">Provisional Slip (Kacha Bill)</option>
                                            <option value="TAX">Final Tax Invoice</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Total Invoice Amount (₹) *</label>
                                        <input type="number" required min="1" step="0.01" className="w-full h-11 md:h-10 px-3 border border-border rounded-lg text-sm text-right font-medium tabular-nums focus:ring-2 focus:ring-blue-500" value={formData.invoice_amount} onChange={(e) => setFormData({ ...formData, invoice_amount: e.target.value })} />
                                    </div>
                                </div>

                                {/* Upload */}
                                <div className="pt-2">
                                    <label className="block text-xs font-bold text-foreground mb-2">Upload Invoice *</label>
                                    <FileUpload
                                        type={formData.invoice_type_submitted === "PROVISIONAL" ? "PROVISIONAL_INVOICE" : "TAX_INVOICE"}
                                        entityId={selectedReq.id}
                                        onUploadSuccess={(path) => setUploadedPath(path)}
                                    />
                                </div>

                                {/* Purchase Lines Table with resizable columns */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-foreground">Purchase Lines</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200" style={{ tableLayout: "fixed" }}>
                                            <thead className="bg-surface-2">
                                                <tr>
                                                    <th style={{ width: widths.material, minWidth: 80, position: "relative" }} className="px-3 py-2 text-left text-xs font-medium text-foreground-tertiary uppercase">Material<ResizeHandle colKey="material" /></th>
                                                    <th style={{ width: widths.description, minWidth: 100, position: "relative" }} className="px-3 py-2 text-left text-xs font-medium text-foreground-tertiary uppercase">Description<ResizeHandle colKey="description" /></th>
                                                    <th style={{ width: widths.qty, minWidth: 60, position: "relative" }} className="px-3 py-2 text-right text-xs font-medium text-foreground-tertiary uppercase">Qty<ResizeHandle colKey="qty" /></th>
                                                    <th style={{ width: widths.rate, minWidth: 80, position: "relative" }} className="px-3 py-2 text-right text-xs font-medium text-foreground-tertiary uppercase">Rate<ResizeHandle colKey="rate" /></th>
                                                    <th style={{ width: widths.amount, minWidth: 90, position: "relative" }} className="px-3 py-2 text-right text-xs font-medium text-foreground-tertiary uppercase">Amount<ResizeHandle colKey="amount" /></th>
                                                    <th style={{ width: 32 }} className="px-3 py-2 text-center text-xs font-medium text-foreground-tertiary uppercase">×</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-secondary">
                                                {purchaseLines.map((line, i) => (
                                                    <tr key={i}>
                                                        <td className="px-3 py-2" style={{ width: widths.material }}>
                                                            <span className="text-sm text-foreground truncate block">{line.material_name}</span>
                                                        </td>
                                                        <td className="px-3 py-2" style={{ width: widths.description }}>
                                                            <input type="text" className="w-full h-8 px-2 border border-border rounded text-sm" value={line.description} onChange={(e) => handleLineChange(i, "description", e.target.value)} />
                                                        </td>
                                                        <td className="px-3 py-2" style={{ width: widths.qty }}>
                                                            <input type="number" required min="1" className="w-full h-8 px-2 border border-border rounded text-sm text-right" value={line.quantity || ""} onChange={(e) => handleLineChange(i, "quantity", Number(e.target.value))} />
                                                        </td>
                                                        <td className="px-3 py-2" style={{ width: widths.rate }}>
                                                            <input type="number" required min="0" step="0.01" className="w-full h-8 px-2 border border-border rounded text-sm text-right" value={line.rate || ""} onChange={(e) => handleLineChange(i, "rate", Number(e.target.value))} />
                                                        </td>
                                                        <td className="px-3 py-2 text-right text-sm font-medium tabular-nums" style={{ width: widths.amount }}>₹{line.amount.toFixed(2)}</td>
                                                        <td className="px-3 py-2 text-center" style={{ width: 32 }}>
                                                            <button type="button" onClick={() => setPurchaseLines(purchaseLines.filter((_, idx) => idx !== i))} disabled={purchaseLines.length === 1} className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-red-400 hover:text-red-600 disabled:opacity-30 rounded">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-surface-2">
                                                <tr>
                                                    <td colSpan={4} className="px-3 py-3 text-right text-sm font-semibold text-foreground-secondary">Total:</td>
                                                    <td className="px-3 py-3 text-right text-sm font-bold text-foreground tabular-nums">₹{linesTotalAmount.toFixed(2)}</td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                            </form>
                        </div>

                        <div className="p-4 border-t border-border-secondary bg-surface-2 flex gap-3 pb-8 md:pb-4">
                            <button type="button" onClick={closeDrawer} className="flex-1 py-3 min-h-[48px] bg-surface-1 border border-border rounded-lg text-sm font-medium text-foreground-secondary hover:bg-surface-2 active:bg-surface-3 transition">
                                Cancel
                            </button>
                            <button type="submit" form="purchase-form" disabled={submitting} className="flex-1 py-3 min-h-[48px] bg-blue-600 rounded-lg text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition flex items-center justify-center gap-2">
                                {submitting ? "Submitting..." : "Submit Purchase"} <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )}
            </div>

            <AddVendorModal
                isOpen={showVendorModal}
                onClose={() => setShowVendorModal(false)}
                onSuccess={(id) => setFormData(prev => ({ ...prev, vendor_id: id }))}
            />
        </div>
    );
}
