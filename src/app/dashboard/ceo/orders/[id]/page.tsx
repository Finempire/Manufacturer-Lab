"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Clock, Package, FileText } from "lucide-react";
import { toast } from "sonner";
import OrderTimeline from "@/components/OrderTimeline";
import OrderPipelineHeader from "@/components/OrderPipelineHeader";

interface OrderDetail {
    id: string;
    order_no: string;
    order_date: string;
    shipping_date: string;
    order_type: string;
    total_amount: number;
    remarks: string | null;
    status: string;
    buyer: { name: string; brand_code: string | null };
    creator: { name: string };
    merchandiser: { id: string; name: string } | null;
    assigned_sample_pm: { id: string; name: string } | null;
    assigned_production_pm: { id: string; name: string } | null;
    lines: { id: string; style: { style_code: string; style_name: string }; description: string | null; quantity: number; rate: number; amount: number }[];
    tech_packs: { id: string; tech_pack_no: string; status: string }[];
    material_requests: { id: string; request_no: string; status: string; runner: { name: string } | null }[];
    expenses: { id: string; expense_no: string; status: string; expected_amount: number }[];
}

const STATUS_COLORS: Record<string, string> = {
    ORDER_RECEIVED: "bg-blue-100 text-blue-800", PENDING_PM_ACCEPTANCE: "bg-amber-100 text-amber-800",
    MERCHANDISER_ASSIGNED: "bg-indigo-100 text-indigo-800", UNDER_PRODUCTION: "bg-amber-100 text-amber-800",
    COMPLETED: "bg-green-100 text-green-800", CANCELLED: "bg-red-100 text-red-800",
};

export default function CEOOrderDetail() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/orders/${params.id}`)
            .then(r => r.json())
            .then(data => { setOrder(data); setLoading(false); })
            .catch(() => { toast.error("Failed to load order"); setLoading(false); });
    }, [params.id]);

    if (loading) return <div className="text-center py-12 text-slate-400">Loading...</div>;
    if (!order) return <div className="text-center py-12 text-slate-400">Order not found</div>;

    const totalExpenses = order.expenses.reduce((s, e) => s + e.expected_amount, 0);

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900">{order.order_no}</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{order.buyer.name} &bull; {order.order_type}</p>
                </div>
                <span className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md ${STATUS_COLORS[order.status] || "bg-slate-100 text-slate-800"}`}>
                    {order.status.replace(/_/g, " ")}
                </span>
            </div>

            {/* Horizontal Pipeline Timeline */}
            <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 shadow-sm">
                <OrderPipelineHeader status={order.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Financial Summary */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col sm:flex-row">
                        <div className="flex-1 p-5 border-b sm:border-b-0 sm:border-r border-slate-100 bg-slate-50">
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Order Value</p>
                            <p className="text-2xl font-bold text-slate-900">₹{order.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="flex-1 p-5 bg-orange-50/30">
                            <p className="text-xs text-orange-600 uppercase tracking-wider font-bold mb-1">Total Expenses</p>
                            <p className="text-2xl font-bold text-orange-700">₹{totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                            <p className="text-xs text-slate-500 mt-1">{order.expenses.length} expense request(s)</p>
                        </div>
                    </div>

                    {/* Order Info */}
                    <div className="bg-white rounded-lg border border-slate-200 p-5">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide border-b pb-2">Order Details</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
                            <div><p className="text-xs text-slate-500 mb-1">Order Date</p><p className="text-sm font-medium">{format(new Date(order.order_date), "dd MMM yyyy")}</p></div>
                            <div><p className="text-xs text-slate-500 mb-1">Shipping Date</p><p className="text-sm font-medium">{format(new Date(order.shipping_date), "dd MMM yyyy")}</p></div>
                            <div><p className="text-xs text-slate-500 mb-1">Created By</p><p className="text-sm font-medium">{order.creator.name}</p></div>
                            <div><p className="text-xs text-slate-500 mb-1">Merchandiser</p><p className="text-sm font-medium">{order.merchandiser?.name || "—"}</p></div>
                        </div>
                    </div>

                    {/* Item Lines */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Item Lines</h3>
                        </div>
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Style</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Qty</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Rate</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {order.lines.map(line => (
                                    <tr key={line.id}>
                                        <td className="px-4 py-2.5 text-sm font-medium text-slate-900">{line.style.style_code}</td>
                                        <td className="px-4 py-2.5 text-sm text-slate-500">{line.description || line.style.style_name}</td>
                                        <td className="px-4 py-2.5 text-sm text-right tabular-nums">{line.quantity}</td>
                                        <td className="px-4 py-2.5 text-sm text-right tabular-nums">₹{line.rate.toLocaleString("en-IN")}</td>
                                        <td className="px-4 py-2.5 text-sm font-medium text-right tabular-nums">₹{line.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50">
                                <tr>
                                    <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Total:</td>
                                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900 tabular-nums">₹{order.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Related */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-purple-500" /><h4 className="text-sm font-bold text-slate-900">Tech Packs ({order.tech_packs.length})</h4></div>
                            {order.tech_packs.length === 0 ? <p className="text-xs text-slate-400">None</p> : order.tech_packs.map(tp => (
                                <div key={tp.id} className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded-lg mb-1.5">
                                    <span className="text-xs font-medium text-slate-700">{tp.tech_pack_no}</span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{tp.status.replace(/_/g, " ")}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-3"><Package className="w-4 h-4 text-orange-500" /><h4 className="text-sm font-bold text-slate-900">Material Requests ({order.material_requests.length})</h4></div>
                            {order.material_requests.length === 0 ? <p className="text-xs text-slate-400">None</p> : order.material_requests.map(mr => (
                                <div key={mr.id} className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded-lg mb-1.5">
                                    <span className="text-xs font-medium text-slate-700">{mr.request_no}</span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{mr.status.replace(/_/g, " ")}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Assignments</h4>
                        <div className="space-y-3">
                            <div><p className="text-xs text-slate-500">Merchandiser</p><p className="text-sm font-medium">{order.merchandiser?.name || "—"}</p></div>
                            <div><p className="text-xs text-slate-500">{order.order_type === "SAMPLE" ? "Sample PM" : "Production PM"}</p><p className="text-sm font-medium">{(order.order_type === "SAMPLE" ? order.assigned_sample_pm?.name : order.assigned_production_pm?.name) || "—"}</p></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3"><Clock className="w-4 h-4 inline mr-1" /> Timeline</h4>
                        <OrderTimeline status={order.status} orderType={order.order_type} />
                    </div>
                </div>
            </div>
        </div>
    );
}
