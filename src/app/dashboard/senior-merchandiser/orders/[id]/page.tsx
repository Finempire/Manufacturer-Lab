"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, Package, FileText, Play, Flag, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface Merchandiser { id: string; name: string; }

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
    const [merchandisers, setMerchandisers] = useState<Merchandiser[]>([]);
    const [selectedMerchandiser, setSelectedMerchandiser] = useState("");
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetch(`/api/orders/${params.id}`)
            .then(r => r.json())
            .then(data => { setOrder(data); setLoading(false); })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
        fetch("/api/master/users?role=MERCHANDISER")
            .then(r => r.json())
            .then(data => setMerchandisers(Array.isArray(data) ? data : []))
            .catch(() => {});
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

    const handleAssignMerchandiser = async () => {
        if (!selectedMerchandiser) { toast.error("Please select a merchandiser"); return; }
        setAssigning(true);
        try {
            const res = await fetch(`/api/orders/${params.id}/assign-merchandiser`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ merchandiser_id: selectedMerchandiser }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Merchandiser assigned");
            const updated = await fetch(`/api/orders/${params.id}`).then(r => r.json());
            setOrder(updated);
            setSelectedMerchandiser("");
        } catch { toast.error("Failed to assign merchandiser"); }
        finally { setAssigning(false); }
    };

    if (loading) return <div className="text-center py-12 text-foreground-muted">Loading...</div>;
    if (!order) return <div className="text-center py-12 text-foreground-muted">Not found</div>;

    const canAccept = order.status === "ORDER_RECEIVED" || order.status === "PENDING_PM_ACCEPTANCE";
    const canAssignMerchandiser = (order.status === "PENDING_PM_ACCEPTANCE" || order.status === "ORDER_RECEIVED") && !order.merchandiser;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-surface-1 border border-border rounded-lg hover:bg-surface-2 transition">
                    <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">{order.order_no}</h1>
                    <p className="text-sm text-foreground-tertiary mt-0.5">{order.buyer.name} &bull; SAMPLE</p>
                </div>
                <span className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md ${STATUS_COLORS[order.status] || "bg-surface-3 text-foreground"}`}>{order.status.replace(/_/g, " ")}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface-1 rounded-lg border border-border p-5">
                        <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide border-b pb-2">Order Information</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6">
                            <div><p className="text-xs text-foreground-tertiary mb-1">Order Date</p><p className="text-sm font-medium">{format(new Date(order.order_date), "dd MMM yyyy")}</p></div>
                            <div><p className="text-xs text-foreground-tertiary mb-1">Shipping Date</p><p className="text-sm font-medium">{format(new Date(order.shipping_date), "dd MMM yyyy")}</p></div>
                            <div><p className="text-xs text-foreground-tertiary mb-1">Merchandiser</p><p className="text-sm font-medium">{order.merchandiser?.name || "—"}</p></div>
                            <div><p className="text-xs text-foreground-tertiary mb-1">Senior Merchandiser</p><p className="text-sm font-medium">{order.assigned_sample_pm?.name || "—"}</p></div>
                        </div>
                    </div>

                    <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                        <div className="px-5 py-3 border-b border-border-secondary bg-surface-2"><h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Item Lines</h3></div>
                        <table className="min-w-full divide-y divide-border-secondary">
                            <thead className="bg-surface-2">
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground-tertiary uppercase">Style</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground-tertiary uppercase">Description</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-foreground-tertiary uppercase">Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-secondary">
                                {order.lines.map(line => (
                                    <tr key={line.id}>
                                        <td className="px-4 py-2.5 text-sm font-medium text-foreground">{line.style.style_code}</td>
                                        <td className="px-4 py-2.5 text-sm text-foreground-tertiary">{line.description || line.style.style_name}</td>
                                        <td className="px-4 py-2.5 text-sm text-right tabular-nums">{line.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-surface-1 rounded-lg border border-border p-4">
                            <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-purple-500" /><h4 className="text-sm font-bold text-foreground">Tech Packs ({order.tech_packs.length})</h4></div>
                            {order.tech_packs.length === 0 ? <p className="text-xs text-foreground-muted">None</p> : order.tech_packs.map(tp => (
                                <div key={tp.id} className="flex items-center justify-between py-1.5 px-2 bg-surface-2 rounded-lg mb-1.5">
                                    <span className="text-xs font-medium text-foreground-secondary">{tp.tech_pack_no}</span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{tp.status.replace(/_/g, " ")}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-surface-1 rounded-lg border border-border p-4">
                            <div className="flex items-center gap-2 mb-3"><Package className="w-4 h-4 text-orange-500" /><h4 className="text-sm font-bold text-foreground">Material Requests ({order.material_requests.length})</h4></div>
                            {order.material_requests.length === 0 ? <p className="text-xs text-foreground-muted">None</p> : order.material_requests.map(mr => (
                                <div key={mr.id} className="flex items-center justify-between py-1.5 px-2 bg-surface-2 rounded-lg mb-1.5">
                                    <span className="text-xs font-medium text-foreground-secondary">{mr.request_no}</span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{mr.status.replace(/_/g, " ")}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-surface-1 rounded-lg border border-border p-4 space-y-3">
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Actions</h4>
                        {canAccept && (
                            <button onClick={handleAccept} disabled={accepting} className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                                <Play className="w-4 h-4" /> {accepting ? "Accepting..." : "Accept Order"}
                            </button>
                        )}

                        {canAssignMerchandiser && (
                            <div className="space-y-2 pt-2 border-t border-border-secondary">
                                <p className="text-xs font-medium text-foreground-secondary">Assign Merchandiser</p>
                                <select className="w-full h-9 px-3 border border-border rounded-lg text-sm" value={selectedMerchandiser} onChange={e => setSelectedMerchandiser(e.target.value)}>
                                    <option value="">Select Merchandiser</option>
                                    {merchandisers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <button onClick={handleAssignMerchandiser} disabled={assigning || !selectedMerchandiser} className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50">
                                    <UserPlus className="w-4 h-4" /> {assigning ? "Assigning..." : "Assign"}
                                </button>
                            </div>
                        )}

                        {order.merchandiser && (
                            <div className="pt-2 border-t border-border-secondary">
                                <p className="text-xs text-foreground-tertiary mb-1">Assigned Merchandiser</p>
                                <p className="text-sm font-medium text-foreground">{order.merchandiser.name}</p>
                            </div>
                        )}

                        {order.status === "UNDER_PRODUCTION" && (
                            <div className="space-y-2">
                                <textarea placeholder="Completion notes" className="w-full p-2.5 border border-border rounded-lg text-sm" rows={2} value={completionNotes} onChange={e => setCompletionNotes(e.target.value)} />
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
                </div>
            </div>
        </div>
    );
}
