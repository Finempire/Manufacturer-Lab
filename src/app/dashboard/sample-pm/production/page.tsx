"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Factory, Eye } from "lucide-react";
import { toast } from "sonner";

interface Order {
    id: string;
    order_no: string;
    order_date: string;
    shipping_date: string;
    status: string;
    buyer: { name: string };
    lines: { quantity: number }[];
}

const PRODUCTION_STATUSES = ["PRODUCTION_ACCEPTED", "UNDER_PRODUCTION", "PRODUCTION_COMPLETED"];

const STATUS_COLORS: Record<string, string> = {
    PRODUCTION_ACCEPTED: "bg-cyan-100 text-cyan-800",
    UNDER_PRODUCTION: "bg-amber-100 text-amber-800",
    PRODUCTION_COMPLETED: "bg-emerald-100 text-emerald-800",
};

export default function SamplePMProductionPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/orders")
            .then(r => r.json())
            .then(data => {
                const filtered = (Array.isArray(data) ? data : []).filter((o: Order) => PRODUCTION_STATUSES.includes(o.status));
                setOrders(filtered);
                setLoading(false);
            })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
    }, []);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Sample Production</h1>
                <p className="text-sm text-foreground-tertiary mt-1">Sample orders in production pipeline</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {PRODUCTION_STATUSES.map(status => (
                    <div key={status} className="bg-surface-1 rounded-lg border border-border p-4">
                        <p className="text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider">{status.replace(/_/g, " ")}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{orders.filter(o => o.status === status).length}</p>
                    </div>
                ))}
            </div>

            <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-surface-2">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Order No</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Buyer</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Order Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Ship Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-tertiary uppercase">View</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-secondary">
                        {loading ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-foreground-muted">Loading...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center">
                                <Factory className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-foreground-tertiary">No samples in production</p>
                            </td></tr>
                        ) : orders.map(order => (
                            <tr key={order.id} className="hover:bg-surface-2">
                                <td className="px-4 py-3 text-sm font-semibold text-foreground">{order.order_no}</td>
                                <td className="px-4 py-3 text-sm text-foreground-secondary">{order.buyer.name}</td>
                                <td className="px-4 py-3 text-sm text-foreground-tertiary">{format(new Date(order.order_date), "dd MMM yyyy")}</td>
                                <td className="px-4 py-3 text-sm text-foreground-tertiary">{format(new Date(order.shipping_date), "dd MMM yyyy")}</td>
                                <td className="px-4 py-3"><span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${STATUS_COLORS[order.status] || "bg-surface-3 text-foreground"}`}>{order.status.replace(/_/g, " ")}</span></td>
                                <td className="px-4 py-3 text-center"><Link href={`/dashboard/sample-pm/orders/${order.id}`} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4 mx-auto" /></Link></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
