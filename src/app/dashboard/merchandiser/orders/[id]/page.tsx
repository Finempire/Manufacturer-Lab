"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, FileText, Clock, Plus } from "lucide-react";
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
    lines: { id: string; style: { style_code: string; style_name: string }; description: string | null; quantity: number }[];
    tech_packs: { id: string; tech_pack_no: string; status: string; fabric_details: string | null; merchandiser_id: string | null }[];
}

const STATUS_COLORS: Record<string, string> = {
    ORDER_RECEIVED: "bg-blue-100 text-blue-800", MERCHANDISER_ASSIGNED: "bg-indigo-100 text-indigo-800",
    TECH_PACK_IN_PROGRESS: "bg-purple-100 text-purple-800", TECH_PACK_COMPLETED: "bg-purple-100 text-purple-800",
    COMPLETED: "bg-green-100 text-green-800", CANCELLED: "bg-red-100 text-red-800",
};

export default function MerchandiserOrderDetail() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetch(`/api/orders/${params.id}`)
            .then(r => r.json())
            .then(data => { setOrder(data); setLoading(false); })
            .catch(() => { toast.error("Failed to load order"); setLoading(false); });
    }, [params.id]);

    const handleCreateTechPack = async () => {
        setCreating(true);
        try {
            const res = await fetch("/api/techpacks", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order_id: params.id }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Tech pack created");
            const updated = await fetch(`/api/orders/${params.id}`).then(r => r.json());
            setOrder(updated);
        } catch { toast.error("Failed to create tech pack"); }
        finally { setCreating(false); }
    };

    if (loading) return <div className="text-center py-12 text-foreground-muted">Loading...</div>;
    if (!order) return <div className="text-center py-12 text-foreground-muted">Order not found</div>;

    const canCreateTechPack = ["MERCHANDISER_ASSIGNED", "TECH_PACK_IN_PROGRESS"].includes(order.status);

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-surface-1 border border-border rounded-lg hover:bg-surface-2 transition">
                    <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">{order.order_no}</h1>
                    <p className="text-sm text-foreground-tertiary mt-0.5">{order.buyer.name} &bull; {order.order_type}</p>
                </div>
                <span className={`px-3 py-1.5 text-xs font-bold uppercase rounded-md ${STATUS_COLORS[order.status] || "bg-surface-3 text-foreground"}`}>
                    {order.status.replace(/_/g, " ")}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Info */}
                    <div className="bg-surface-1 rounded-lg border border-border p-5">
                        <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide border-b pb-2">Order Information</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                            <div><p className="text-xs text-foreground-tertiary mb-1">Order Date</p><p className="text-sm font-medium">{format(new Date(order.order_date), "dd MMM yyyy")}</p></div>
                            <div><p className="text-xs text-foreground-tertiary mb-1">Shipping Date</p><p className="text-sm font-medium">{format(new Date(order.shipping_date), "dd MMM yyyy")}</p></div>
                            <div><p className="text-xs text-foreground-tertiary mb-1">Buyer</p><p className="text-sm font-medium">{order.buyer.name}</p></div>
                        </div>
                    </div>

                    {/* Item Lines */}
                    <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                        <div className="px-5 py-3 border-b border-border-secondary bg-surface-2">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Item Lines</h3>
                        </div>
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
                                        <td className="px-4 py-2.5 text-sm text-foreground text-right tabular-nums">{line.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Tech Packs */}
                    <div className="bg-surface-1 rounded-lg border border-border p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-purple-500" />
                                <h3 className="text-sm font-bold text-foreground">Tech Packs ({order.tech_packs.length})</h3>
                            </div>
                            {canCreateTechPack && (
                                <button onClick={handleCreateTechPack} disabled={creating} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 disabled:opacity-50">
                                    <Plus className="w-3.5 h-3.5" /> {creating ? "Creating..." : "New Tech Pack"}
                                </button>
                            )}
                        </div>
                        {order.tech_packs.length === 0 ? (
                            <p className="text-sm text-foreground-muted text-center py-6">No tech packs yet. Create one to start working.</p>
                        ) : (
                            <div className="space-y-3">
                                {order.tech_packs.map(tp => (
                                    <div key={tp.id} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-border-secondary hover:bg-surface-3 transition cursor-pointer">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{tp.tech_pack_no}</p>
                                            <p className="text-xs text-foreground-muted mt-0.5">{tp.fabric_details || "No fabric details"}</p>
                                        </div>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{tp.status.replace(/_/g, " ")}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-surface-1 rounded-lg border border-border p-4">
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">
                            <Clock className="w-4 h-4 inline mr-1" /> Timeline
                        </h4>
                        <OrderTimeline status={order.status} orderType={order.order_type} />
                    </div>
                </div>
            </div>
        </div>
    );
}
