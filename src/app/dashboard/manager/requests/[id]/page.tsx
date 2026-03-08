"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Package, FileText } from "lucide-react";
import { toast } from "sonner";

interface RequestDetail {
    id: string;
    request_no: string;
    status: string;
    store_location: string | null;
    expected_date: string | null;
    remarks: string | null;
    created_at: string;
    manager: { name: string };
    buyer: { name: string };
    order: { order_no: string };
    style: { style_code: string; style_name: string } | null;
    preferred_vendor: { name: string } | null;
    runner: { name: string };
    lines: { id: string; material: { description: string; category: string }; quantity: number; expected_rate: number; expected_amount: number }[];
    purchases: { id: string; purchase_no: string; status: string; invoice_amount: number }[];
}

const STATUS_COLORS: Record<string, string> = {
    PENDING_PURCHASE: "bg-amber-100 text-amber-800", INVOICE_SUBMITTED: "bg-blue-100 text-blue-800",
    APPROVED: "bg-indigo-100 text-indigo-800", PAID: "bg-green-100 text-green-800",
    COMPLETED: "bg-green-100 text-green-800", CANCELLED: "bg-red-100 text-red-800",
};

export default function ManagerRequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [request, setRequest] = useState<RequestDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/material-requests/${params.id}`)
            .then(r => r.json())
            .then(data => { setRequest(data); setLoading(false); })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
    }, [params.id]);

    if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;
    if (!request) return <div className="text-center py-12 text-slate-400">Request not found</div>;

    const totalExpected = request.lines.reduce((s, l) => s + l.expected_amount, 0);

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900">{request.request_no}</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{request.order.order_no} &bull; {request.buyer.name}</p>
                </div>
                <span className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md ${STATUS_COLORS[request.status] || "bg-slate-100 text-slate-800"}`}>
                    {request.status.replace(/_/g, " ")}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg border border-slate-200 p-5">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide border-b pb-2">Request Details</h3>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                            <div><p className="text-xs text-slate-500 mb-1">Runner</p><p className="text-sm font-medium">{request.runner.name}</p></div>
                            <div><p className="text-xs text-slate-500 mb-1">Preferred Vendor</p><p className="text-sm font-medium">{request.preferred_vendor?.name || "—"}</p></div>
                            {request.style && <div><p className="text-xs text-slate-500 mb-1">Style</p><p className="text-sm font-medium">{request.style.style_code}</p></div>}
                            {request.expected_date && <div><p className="text-xs text-slate-500 mb-1">Expected By</p><p className="text-sm font-medium">{format(new Date(request.expected_date), "dd MMM yyyy")}</p></div>}
                            {request.store_location && <div><p className="text-xs text-slate-500 mb-1">Store Location</p><p className="text-sm font-medium">{request.store_location}</p></div>}
                            {request.remarks && <div className="col-span-2"><p className="text-xs text-slate-500 mb-1">Remarks</p><p className="text-sm text-slate-700">{request.remarks}</p></div>}
                        </div>
                    </div>

                    {/* Material Lines */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Material Lines</h3>
                        </div>
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Material</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Qty</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Rate</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {request.lines.map(line => (
                                    <tr key={line.id}>
                                        <td className="px-4 py-2.5 text-sm text-slate-900">{line.material.description}</td>
                                        <td className="px-4 py-2.5 text-sm text-right tabular-nums">{line.quantity}</td>
                                        <td className="px-4 py-2.5 text-sm text-right tabular-nums">₹{line.expected_rate.toLocaleString("en-IN")}</td>
                                        <td className="px-4 py-2.5 text-sm font-medium text-right tabular-nums">₹{line.expected_amount.toLocaleString("en-IN")}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50">
                                <tr>
                                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold">Total:</td>
                                    <td className="px-4 py-3 text-right text-sm font-bold tabular-nums">₹{totalExpected.toLocaleString("en-IN")}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Purchases */}
                    {request.purchases.length > 0 && (
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <h4 className="text-sm font-bold text-slate-900 mb-3">Purchases ({request.purchases.length})</h4>
                            <div className="space-y-2">
                                {request.purchases.map(p => (
                                    <div key={p.id} className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded-lg">
                                        <span className="text-xs font-medium text-slate-700">{p.purchase_no}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs tabular-nums">₹{p.invoice_amount.toLocaleString("en-IN")}</span>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{p.status.replace(/_/g, " ")}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Summary</h4>
                        <div className="space-y-3">
                            <div><p className="text-xs text-slate-500">Total Materials</p><p className="text-sm font-bold">{request.lines.length} items</p></div>
                            <div><p className="text-xs text-slate-500">Expected Total</p><p className="text-sm font-bold text-slate-900">₹{totalExpected.toLocaleString("en-IN")}</p></div>
                            <div><p className="text-xs text-slate-500">Created</p><p className="text-sm font-medium">{format(new Date(request.created_at), "dd MMM yyyy")}</p></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
