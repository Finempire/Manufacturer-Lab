"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, UserPlus, CheckCircle, XCircle, Clock, Package, FileText } from "lucide-react";
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
    buyer: { id: string; name: string; brand_code: string | null };
    creator: { name: string };
    merchandiser: { id: string; name: string } | null;
    assigned_sample_pm: { id: string; name: string } | null;
    assigned_production_pm: { id: string; name: string } | null;
    pm_accepted_by: { id: string; name: string } | null;
    lines: { id: string; style: { style_code: string; style_name: string }; description: string | null; quantity: number; rate: number; amount: number }[];
    tech_packs: { id: string; tech_pack_no: string; status: string }[];
    material_requirements: { id: string; status: string }[];
    material_requests: { id: string; request_no: string; status: string; runner: { name: string } | null }[];
    expenses: { id: string; expense_no: string; status: string; expected_amount: number }[];
}

const STATUS_COLORS: Record<string, string> = {
    ORDER_RECEIVED: "bg-blue-100 text-blue-800 border-blue-200",
    PENDING_PM_ACCEPTANCE: "bg-amber-100 text-amber-800 border-amber-200",
    MERCHANDISER_ASSIGNED: "bg-indigo-100 text-indigo-800 border-indigo-200",
    TECH_PACK_IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-200",
    TECH_PACK_COMPLETED: "bg-purple-100 text-purple-800 border-purple-200",
    MATERIAL_REQUIREMENT_SENT: "bg-orange-100 text-orange-800 border-orange-200",
    MATERIAL_IN_PROGRESS: "bg-orange-100 text-orange-800 border-orange-200",
    MATERIAL_COMPLETED: "bg-teal-100 text-teal-800 border-teal-200",
    PRODUCTION_ACCEPTED: "bg-cyan-100 text-cyan-800 border-cyan-200",
    UNDER_PRODUCTION: "bg-amber-100 text-amber-800 border-amber-200",
    PRODUCTION_COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

export default function AccountantOrderDetail() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [merchandisers, setMerchandisers] = useState<{ id: string; name: string }[]>([]);
    const [selectedMerch, setSelectedMerch] = useState("");
    const [assigning, setAssigning] = useState(false);
    const [showAssignPanel, setShowAssignPanel] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        fetch(`/api/orders/${params.id}`)
            .then(r => r.json())
            .then(data => { setOrder(data); setLoading(false); })
            .catch(() => { toast.error("Failed to load order"); setLoading(false); });
    }, [params.id]);

    const loadMerchandisers = () => {
        fetch("/api/admin/users?role=MERCHANDISER")
            .then(r => r.json())
            .then(data => setMerchandisers(data.filter((u: { is_active: boolean }) => u.is_active)))
            .catch(() => toast.error("Failed to load merchandisers"));
        setShowAssignPanel(true);
    };

    const handleAssignMerchandiser = async () => {
        if (!selectedMerch) return;
        setAssigning(true);
        try {
            const res = await fetch(`/api/orders/${params.id}/assign-merchandiser`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ merchandiser_id: selectedMerch }),
            });
            if (!res.ok) throw new Error("Failed to assign");
            toast.success("Merchandiser assigned");
            const updated = await fetch(`/api/orders/${params.id}`).then(r => r.json());
            setOrder(updated);
            setShowAssignPanel(false);
        } catch {
            toast.error("Failed to assign merchandiser");
        } finally {
            setAssigning(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel this order?")) return;
        setCancelling(true);
        try {
            const res = await fetch(`/api/orders/${params.id}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: "Cancelled by accountant" }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Order cancelled");
            const updated = await fetch(`/api/orders/${params.id}`).then(r => r.json());
            setOrder(updated);
        } catch {
            toast.error("Failed to cancel order");
        } finally {
            setCancelling(false);
        }
    };

    if (loading) return <div className="text-center py-12 text-slate-400">Loading order...</div>;
    if (!order) return <div className="text-center py-12 text-slate-400">Order not found</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900">{order.order_no}</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{order.buyer.name} {order.buyer.brand_code ? `(${order.buyer.brand_code})` : ""} &bull; {order.order_type}</p>
                </div>
                <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md border ${STATUS_COLORS[order.status] || "bg-slate-100 text-slate-800 border-slate-200"}`}>
                    {order.status.replace(/_/g, " ")}
                </span>
            </div>

            {/* Horizontal Pipeline Timeline */}
            <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 shadow-sm">
                <OrderPipelineHeader status={order.status} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Info Card */}
                    <div className="bg-white rounded-lg border border-slate-200 p-5">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide border-b pb-2">Order Information</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
                            <div><p className="text-xs text-slate-500 mb-1">Order Date</p><p className="text-sm font-medium">{format(new Date(order.order_date), "dd MMM yyyy")}</p></div>
                            <div><p className="text-xs text-slate-500 mb-1">Shipping Date</p><p className="text-sm font-medium">{format(new Date(order.shipping_date), "dd MMM yyyy")}</p></div>
                            <div><p className="text-xs text-slate-500 mb-1">Created By</p><p className="text-sm font-medium">{order.creator.name}</p></div>
                            <div><p className="text-xs text-slate-500 mb-1">Merchandiser</p><p className="text-sm font-medium">{order.merchandiser?.name || "Not assigned"}</p></div>
                        </div>
                        {order.remarks && (
                            <div className="mt-4 pt-3 border-t border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">Remarks</p>
                                <p className="text-sm text-slate-700">{order.remarks}</p>
                            </div>
                        )}
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
                                        <td className="px-4 py-2.5 text-sm text-slate-900 text-right tabular-nums">{line.quantity}</td>
                                        <td className="px-4 py-2.5 text-sm text-slate-900 text-right tabular-nums">₹{line.rate.toLocaleString("en-IN")}</td>
                                        <td className="px-4 py-2.5 text-sm font-medium text-slate-900 text-right tabular-nums">₹{line.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
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

                    {/* Related Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tech Packs */}
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-4 h-4 text-purple-500" />
                                <h4 className="text-sm font-bold text-slate-900">Tech Packs ({order.tech_packs.length})</h4>
                            </div>
                            {order.tech_packs.length === 0 ? (
                                <p className="text-xs text-slate-400">No tech packs created yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {order.tech_packs.map(tp => (
                                        <div key={tp.id} className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded-lg">
                                            <span className="text-xs font-medium text-slate-700">{tp.tech_pack_no}</span>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{tp.status.replace(/_/g, " ")}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Material Requests */}
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Package className="w-4 h-4 text-orange-500" />
                                <h4 className="text-sm font-bold text-slate-900">Material Requests ({order.material_requests.length})</h4>
                            </div>
                            {order.material_requests.length === 0 ? (
                                <p className="text-xs text-slate-400">No material requests yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {order.material_requests.map(mr => (
                                        <div key={mr.id} className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded-lg">
                                            <div>
                                                <span className="text-xs font-medium text-slate-700">{mr.request_no}</span>
                                                {mr.runner && <span className="text-[10px] text-slate-400 ml-1">({mr.runner.name})</span>}
                                            </div>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{mr.status.replace(/_/g, " ")}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expenses */}
                    {order.expenses.length > 0 && (
                        <div className="bg-white rounded-lg border border-slate-200 p-4">
                            <h4 className="text-sm font-bold text-slate-900 mb-3">Expense Requests ({order.expenses.length})</h4>
                            <div className="space-y-2">
                                {order.expenses.map(exp => (
                                    <div key={exp.id} className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded-lg">
                                        <span className="text-xs font-medium text-slate-700">{exp.expense_no}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-600 tabular-nums">₹{exp.expected_amount.toLocaleString("en-IN")}</span>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{exp.status.replace(/_/g, " ")}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Timeline & Actions */}
                <div className="space-y-6">
                    {/* Actions */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Actions</h4>

                        {!order.merchandiser && order.status === "ORDER_RECEIVED" && (
                            <>
                                {!showAssignPanel ? (
                                    <button onClick={loadMerchandisers} className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
                                        <UserPlus className="w-4 h-4" /> Assign Merchandiser
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <select className="w-full h-9 px-3 border border-slate-300 rounded-lg text-sm" value={selectedMerch} onChange={e => setSelectedMerch(e.target.value)}>
                                            <option value="">Select merchandiser...</option>
                                            {merchandisers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowAssignPanel(false)} className="flex-1 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                                            <button onClick={handleAssignMerchandiser} disabled={!selectedMerch || assigning} className="flex-1 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                                {assigning ? "Assigning..." : "Assign"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
                            <button onClick={handleCancel} disabled={cancelling} className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-red-600 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-50 transition disabled:opacity-50">
                                <XCircle className="w-4 h-4" /> {cancelling ? "Cancelling..." : "Cancel Order"}
                            </button>
                        )}

                        {order.status === "COMPLETED" && (
                            <div className="flex items-center gap-2 py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700">Order Completed</span>
                            </div>
                        )}
                    </div>

                    {/* Assignments */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Assignments</h4>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500">Merchandiser</p>
                                <p className="text-sm font-medium text-slate-900">{order.merchandiser?.name || "—"}</p>
                            </div>
                            {order.order_type === "SAMPLE" && (
                                <div>
                                    <p className="text-xs text-slate-500">Sample PM</p>
                                    <p className="text-sm font-medium text-slate-900">{order.assigned_sample_pm?.name || "—"}</p>
                                </div>
                            )}
                            {order.order_type === "PRODUCTION" && (
                                <div>
                                    <p className="text-xs text-slate-500">Production PM</p>
                                    <p className="text-sm font-medium text-slate-900">{order.assigned_production_pm?.name || "—"}</p>
                                </div>
                            )}
                            {order.pm_accepted_by && (
                                <div>
                                    <p className="text-xs text-slate-500">PM Accepted By</p>
                                    <p className="text-sm font-medium text-slate-900">{order.pm_accepted_by.name}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">
                            <Clock className="w-4 h-4 inline mr-1" /> Timeline
                        </h4>
                        <OrderTimeline status={order.status} orderType={order.order_type} />
                    </div>
                </div>
            </div>
        </div>
    );
}
