"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";

interface OrderDetail {
    id: string;
    order_no: string;
    order_date: string;
    shipping_date: string;
    order_type: string;
    remarks: string | null;
    status: string;
    buyer: { name: string; brand_code: string | null };
    lines: { id: string; style: { style_code: string; style_name: string }; description: string | null; quantity: number }[];
}

export default function MerchandiserOrderDetail() {
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

    if (loading) return <div className="text-center py-12 text-foreground-muted">Loading...</div>;
    if (!order) return <div className="text-center py-12 text-foreground-muted">Order not found</div>;

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
                <StatusBadge status={order.status} size="md" />
            </div>

            {/* Order Info */}
            <div className="bg-surface-1 rounded-lg border border-border p-5">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide border-b pb-2">Order Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                    <div><p className="text-xs text-foreground-tertiary mb-1">Order Date</p><p className="text-sm font-medium">{format(new Date(order.order_date), "dd MMM yyyy")}</p></div>
                    <div><p className="text-xs text-foreground-tertiary mb-1">Shipping Date</p><p className="text-sm font-medium">{format(new Date(order.shipping_date), "dd MMM yyyy")}</p></div>
                    <div><p className="text-xs text-foreground-tertiary mb-1">Buyer</p><p className="text-sm font-medium">{order.buyer.name}</p></div>
                    {order.remarks && <div className="col-span-full"><p className="text-xs text-foreground-tertiary mb-1">Remarks</p><p className="text-sm font-medium">{order.remarks}</p></div>}
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
        </div>
    );
}
