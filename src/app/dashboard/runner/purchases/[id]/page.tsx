"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, FileText, ChevronRight, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";

interface PurchaseDetail {
    id: string;
    purchase_no: string;
    invoice_no: string;
    invoice_date: string;
    invoice_amount: number;
    invoice_type_submitted: "PROVISIONAL" | "TAX";
    provisional_invoice_path: string | null;
    tax_invoice_path: string | null;
    status: string;
    vendor: { name: string; contact_person: string | null; phone: string | null; address: string | null };
    request: { request_no: string; manager: { name: string } };
    payments: { id: string; payment_date: string; amount_paid: number; payment_method: string; payment_proof_path: string; reference_id: string | null }[];
    confirmation: { status: string; shown_to_vendor_at: string | null; runner_remark: string | null } | null;
}

export default function PurchaseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [remark, setRemark] = useState("");

    // If runner uploads final tax invoice
    const [taxUploadPath, setTaxUploadPath] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/purchases/${params.id}`)
            .then(r => r.json())
            .then(data => setPurchase(data))
            .catch(() => toast.error("Failed to load purchase details"))
            .finally(() => setLoading(false));
    }, [params.id]);

    const handleConfirmShown = async () => {
        if (!purchase) return;
        setConfirming(true);
        try {
            const res = await fetch(`/api/purchases/${purchase.id}/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ remark }),
            });
            if (!res.ok) throw new Error("Failed to confirm");
            toast.success("Confirmation saved");

            // Reload
            const updated = await fetch(`/api/purchases/${params.id}`).then(r => r.json());
            setPurchase(updated);
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Error confirming");
        } finally {
            setConfirming(false);
        }
    };

    const handleTaxUploadSubmit = async () => {
        if (!purchase || !taxUploadPath) return;
        try {
            const res = await fetch(`/api/purchases/${purchase.id}/tax-invoice`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tax_invoice_path: taxUploadPath }),
            });
            if (!res.ok) throw new Error("Failed to save final invoice");
            toast.success("Final Tax Invoice saved!");

            const updated = await fetch(`/api/purchases/${params.id}`).then(r => r.json());
            setPurchase(updated);
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Error");
        }
    };

    if (loading) return <div className="text-center py-12 text-foreground-tertiary">Loading details...</div>;
    if (!purchase) return <div className="text-center py-12 text-foreground-tertiary">Purchase not found</div>;

    const needsTaxInvoice = purchase.status === "PAID_PENDING_TAX_INVOICE" && purchase.invoice_type_submitted === "PROVISIONAL";
    const payment = purchase.payments?.[0]; // Assuming 1 payment for simplicity

    const renderDocumentCard = (title: string, path: string | null, type: string) => {
        if (!path) return null;
        return (
            <div className="border border-border rounded-lg p-4 bg-surface-1 flex flex-col justify-between h-full">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-5 h-5" /></div>
                    <div>
                        <p className="text-sm font-bold text-foreground">{title}</p>
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-0.5"><CheckCircle className="w-3 h-3" /> Uploaded</p>
                    </div>
                </div>
                <div className="flex gap-2 mt-auto">
                    <button onClick={() => window.open(`/api/files/${path}?action=inline`, '_blank')} className="flex-1 py-1.5 text-xs font-medium bg-surface-2 border border-border rounded hover:bg-surface-3 text-foreground-secondary transition">View</button>
                    <a href={`/api/files/${path}?action=download`} className="flex-1 text-center py-1.5 text-xs font-medium bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 text-blue-700 transition">Download</a>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-surface-1 border border-border rounded-lg hover:bg-surface-2 transition">
                    <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
                </button>
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">{purchase.purchase_no}</h1>
                    <p className="text-sm text-foreground-tertiary mt-0.5">Ref: {purchase.request.request_no} • {format(new Date(purchase.invoice_date), "dd MMM yyyy")}</p>
                </div>
                <div className="ml-auto">
                    <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md border text-blue-800 bg-blue-50 border-blue-200">{purchase.status.replace(/_/g, " ")}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Details */}
                <div className="md:col-span-2 space-y-6">
                    {/* Vendor Info */}
                    <div className="bg-surface-1 rounded-lg border border-border p-5">
                        <h3 className="text-sm font-bold text-foreground mb-4 tracking-wide uppercase border-b pb-2">Vendor Details</h3>
                        <div className="grid grid-cols-2 gap-y-4">
                            <div>
                                <p className="text-xs text-foreground-tertiary mb-1">Vendor Name</p>
                                <p className="text-sm font-medium text-foreground">{purchase.vendor.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-foreground-tertiary mb-1">Contact</p>
                                <p className="text-sm font-medium text-foreground">{purchase.vendor.contact_person || "-"} {purchase.vendor.phone ? `(${purchase.vendor.phone})` : ""}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-foreground-tertiary mb-1">Address / Notes</p>
                                <p className="text-sm font-medium text-foreground">{purchase.vendor.address || "No address provided"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Invoice & Payment Totals */}
                    <div className="bg-surface-1 rounded-lg border border-border overflow-hidden flex flex-col sm:flex-row">
                        <div className="flex-1 p-5 border-b sm:border-b-0 sm:border-r border-border-secondary bg-surface-2">
                            <p className="text-xs text-foreground-tertiary uppercase tracking-wider font-bold mb-1">Billed Amount</p>
                            <p className="text-2xl font-bold text-foreground">₹{purchase.invoice_amount.toLocaleString()}</p>
                            <p className="text-xs text-foreground-tertiary mt-2">Inv No: <span className="font-medium text-foreground">{purchase.invoice_no}</span></p>
                            <p className="text-xs text-foreground-tertiary mt-1">Type: <span className="font-medium text-foreground">{purchase.invoice_type_submitted}</span></p>
                        </div>
                        <div className="flex-1 p-5 bg-blue-50/30">
                            <p className="text-xs text-blue-600 uppercase tracking-wider font-bold mb-1">Amount Paid</p>
                            <p className="text-2xl font-bold text-blue-700">₹{payment?.amount_paid?.toLocaleString() || "0.00"}</p>
                            {payment ? (
                                <>
                                    <p className="text-xs text-foreground-tertiary mt-2">Method: <span className="font-medium text-foreground">{payment.payment_method}</span></p>
                                    <p className="text-xs text-foreground-tertiary mt-1">Ref: <span className="font-medium text-foreground">{payment.reference_id || "-"}</span></p>
                                </>
                            ) : (
                                <p className="text-xs text-foreground-tertiary mt-2 italic">Awaiting Accountant Payment</p>
                            )}
                        </div>
                    </div>

                    {/* STAGE 8A: Vendor Confirmation (Runner Action) */}
                    {purchase.confirmation && (
                        <div className={`rounded-lg border p-5 ${purchase.confirmation.status === 'NOT_CONFIRMED' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2 rounded-lg ${purchase.confirmation.status === 'NOT_CONFIRMED' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                    <CheckSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={`text-sm font-bold ${purchase.confirmation.status === 'NOT_CONFIRMED' ? 'text-amber-900' : 'text-green-900'}`}>Vendor Confirmation</h3>
                                    <p className={`text-xs mt-0.5 ${purchase.confirmation.status === 'NOT_CONFIRMED' ? 'text-amber-700' : 'text-green-700'}`}>
                                        {purchase.confirmation.status === 'NOT_CONFIRMED'
                                            ? "Show the payment proof to the vendor and confirm below."
                                            : `Shown to vendor at ${format(new Date(purchase.confirmation.shown_to_vendor_at!), "dd MMM p")}`}
                                    </p>
                                </div>
                            </div>

                            {purchase.confirmation.status === 'NOT_CONFIRMED' && (
                                <div className="mt-4 space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Optional remark (e.g., 'Vendor checked phone alert')"
                                        className="w-full text-sm p-2.5 rounded-lg border border-amber-200 bg-surface-1 placeholder:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={remark}
                                        onChange={e => setRemark(e.target.value)}
                                    />
                                    <button
                                        onClick={handleConfirmShown}
                                        disabled={confirming}
                                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-lg transition shadow-sm disabled:opacity-50"
                                    >
                                        {confirming ? "Saving..." : "Mark as Shown to Vendor"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STAGE 8B: Missing Final Tax Invoice Banner */}
                    {needsTaxInvoice && (
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-5 rounded-r-xl shadow-sm">
                            <h3 className="text-orange-900 font-bold text-sm flex items-center gap-2 mb-2">
                                <FileText className="w-5 h-5 text-orange-600" /> Action Required: Upload Final Tax Invoice
                            </h3>
                            <p className="text-xs text-orange-800 mb-4">Because a Provisional Slip was initially submitted, a final GST Tax Invoice must now be uploaded to close this transaction.</p>

                            <div className="bg-surface-1 p-3 rounded-lg border border-orange-200">
                                <FileUpload
                                    type="TAX_INVOICE"
                                    entityId={purchase.id}
                                    onUploadSuccess={path => setTaxUploadPath(path)}
                                />
                                {taxUploadPath && (
                                    <button onClick={handleTaxUploadSubmit} className="mt-3 w-full py-2.5 bg-orange-600 text-white rounded font-medium text-sm hover:bg-orange-700 transition flex justify-center items-center gap-2">
                                        Submit Final Document <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Column - Documents Rack */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground tracking-wide uppercase px-1">Attached Documents</h3>

                    <div className="grid grid-cols-1 gap-4">
                        {renderDocumentCard("Initial Invoice", purchase.invoice_type_submitted === 'PROVISIONAL' ? purchase.provisional_invoice_path : purchase.tax_invoice_path, "INVOICE")}

                        {payment?.payment_proof_path && renderDocumentCard("Payment Proof", payment.payment_proof_path, "PAYMENT")}

                        {purchase.invoice_type_submitted === 'PROVISIONAL' && purchase.tax_invoice_path && renderDocumentCard("Final Tax Invoice", purchase.tax_invoice_path, "TAX_INVOICE")}
                    </div>
                </div>
            </div>
        </div>
    );
}
