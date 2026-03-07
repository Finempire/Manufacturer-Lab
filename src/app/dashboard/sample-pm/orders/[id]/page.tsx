"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, Clock, Package, FileText, Play, Flag } from "lucide-react";
import { toast } from "sonner";
import OrderTimeline from "@/components/OrderTimeline";

interface OrderDetail {
    id: string;
    order_no: string;
    order_date: string;
    shipping_date: string;
    order_type: string;
    remarks: string | null;
    status: string;
    buyer: { name: string; brand_code: string | null };
    merchandiser: { id: string; name: string } | null;
    assigned_sample_pm: { id: string; name: string } | null;
    pm_accepted_by: { id: string; name: string } | null;
    lines: { id: string; style: { style_code: string; style_name: string }; description: string | null; quantity: number }[];
    tech_packs: { id: string; tech_pack_no: string; status: string }[];
    material_requirements: { id: string; status: string }[];
    material_requests: { id: string; request_no: string; status: string; runner: { name: string } | null }[];
}

const STATUS_COLORS: Record<string, string> = {
    ORDER_RECEIVED: "bg-blue-100 text-blue-800", PENDING_PM_ACCEPTANCE: "bg-amber-100 text-amber-800",
    MERCHANDISER_ASSIGNED: "bg-indigo-100 text-indigo-800", UNDER_PRODUCTION: "bg-amber-100 text-amber-800",
    COMPLETED: "bg-green-100 text-green-800", CANCELLED: "bg-red-100 text-red-800",
};

export default function SamplePMOrderDetail() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [completionNotes, setCompletionNotes] = useState("");

    useEffect(() => {
        fetch(`/api/orders/${params.id}`)
            .then(r => r.json())
            .then(data => { setOrder(data); setLoading(false); })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
    }, [params.id]);

    const handleAccept = async () => {
        setAccepting(true);
        try {
            const res = await fetch(`/api/orders/${params.id}/accept`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes: "Accepted by sample PM" }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Order accepted");
            const updated = await fetch(`/api/orders/${params.id}`).then(r => r.json());
            setOrder(updated);
        } catch { toast.error("Failed to accept"); }
        finally { setAccepting(false); }
    };

    const handleComplete = async () => {
        setCompleting(true);
        try {
            const res = await fetch(`/api/orders/${params.id}/mark-completed`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes: completionNotes }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Completed");
            const updated = await fetch(`/api/orders/${params.id}`).then(r => r.json());
            setOrder(updated);
        } catch { toast.error("Failed"); }
        finally { setCompleting(false); }
    };

    if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
    if (!order) return <div className="text-center py-12 text-gray-400">Not found</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900">{order.order_no}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{order.buyer.name} &bull; SAMPLE</p>
                </div>
                <span className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>{order.status.replace(/_/g, " ")}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide border-b pb-2">Order Information</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
                            <div><p className="text-xs text-gray-500 mb-1">Order Date</p><p className="text-sm font-medium">{format(new Date(order.order_date), "dd MMM yyyy")}</p></div>
                            <div><p className="text-xs text-gray-500 mb-1">Shipping Date</p><p className="text-sm font-medium">{format(new Date(order.shipping_date), "dd MMM yyyy")}</p></div>
                            <div><p className="text-xs text-gray-500 mb-1">Merchandiser</p><p className="text-sm font-medium">{order.merchandiser?.name || "—"}</p></div>
                            <div><p className="text-xs text-gray-500 mb-1">Sample PM</p><p className="text-sm font-medium">{order.assigned_sample_pm?.name || "—"}</p></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50"><h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Item Lines</h3></div>
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Style</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {order.lines.map(line => (
                                    <tr key={line.id}>
                                        <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{line.style.style_code}</td>
                                        <td className="px-4 py-2.5 text-sm text-gray-500">{line.description || line.style.style_name}</td>
                                        <td className="px-4 py-2.5 text-sm text-right tabular-nums">{line.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-purple-500" /><h4 className="text-sm font-bold text-gray-900">Tech Packs ({order.tech_packs.length})</h4></div>
                            {order.tech_packs.length === 0 ? <p className="text-xs text-gray-400">None</p> : order.tech_packs.map(tp => (
                                <div key={tp.id} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg mb-1.5">
                                    <span className="text-xs font-medium text-gray-700">{tp.tech_pack_no}</span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{tp.status.replace(/_/g, " ")}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center gap-2 mb-3"><Package className="w-4 h-4 text-orange-500" /><h4 className="text-sm font-bold text-gray-900">Material Requests ({order.material_requests.length})</h4></div>
                            {order.material_requests.length === 0 ? <p className="text-xs text-gray-400">None</p> : order.material_requests.map(mr => (
                                <div key={mr.id} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg mb-1.5">
                                    <span className="text-xs font-medium text-gray-700">{mr.request_no}</span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{mr.status.replace(/_/g, " ")}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Actions</h4>
                        {order.status === "PENDING_PM_ACCEPTANCE" && (
                            <button onClick={handleAccept} disabled={accepting} className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                                <Play className="w-4 h-4" /> {accepting ? "Accepting..." : "Accept Order"}
                            </button>
                        )}
                        {order.status === "UNDER_PRODUCTION" && (
                            <div className="space-y-2">
                                <textarea placeholder="Completion notes" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" rows={2} value={completionNotes} onChange={e => setCompletionNotes(e.target.value)} />
                                <button onClick={handleComplete} disabled={completing} className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                                    <Flag className="w-4 h-4" /> {completing ? "Completing..." : "Mark Complete"}
                                </button>
                            </div>
                        )}
                        {order.status === "COMPLETED" && (
                            <div className="flex items-center gap-2 py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm font-medium text-green-700">Completed</span>
                            </div>
                        )}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3"><Clock className="w-4 h-4 inline mr-1" /> Timeline</h4>
                        <OrderTimeline status={order.status} orderType={order.order_type} />
                    </div>
                </div>
            </div>
        </div>
    );
}
