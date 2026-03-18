"use client";
import { ShoppingCart, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";

interface Order { id: string; order_no: string; order_date: string; buyer: { name: string }; order_type: string; total_amount: number; status: string; }

const STATUS_COLORS: Record<string, string> = {
    ORDER_RECEIVED: "bg-blue-100 text-blue-800",
    PENDING_PM_ACCEPTANCE: "bg-amber-100 text-amber-800",
    MERCHANDISER_ASSIGNED: "bg-indigo-100 text-indigo-800",
    TECH_PACK_IN_PROGRESS: "bg-purple-100 text-purple-800",
    MATERIAL_IN_PROGRESS: "bg-orange-100 text-orange-800",
    UNDER_PRODUCTION: "bg-amber-100 text-amber-800",
    PRODUCTION_COMPLETED: "bg-emerald-100 text-emerald-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
};

export default function ProductionOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    useEffect(() => { fetch("/api/orders").then(r => r.json()).then(setOrders).catch(() => { }); }, []);

    return (
        <div className="space-y-4">
            <div><h1 className="text-lg font-semibold tracking-tight text-foreground">Orders</h1><p className="text-sm text-foreground-tertiary mt-1">View and manage production orders</p></div>
            <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-surface-2">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Order</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Buyer</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-tertiary uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-secondary">
                        {orders.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-foreground-muted"><ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-300" />No orders yet</td></tr>
                        ) : orders.map(o => (
                            <tr key={o.id} className="hover:bg-surface-2">
                                <td className="px-4 py-3 text-sm font-semibold text-foreground">{o.order_no}</td>
                                <td className="px-4 py-3 text-sm text-foreground-tertiary">{format(new Date(o.order_date), "dd MMM yyyy")}</td>
                                <td className="px-4 py-3 text-sm text-foreground">{o.buyer?.name}</td>
                                <td className="px-4 py-3"><span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${STATUS_COLORS[o.status] || "bg-surface-3 text-foreground"}`}>{o.status.replace(/_/g, " ")}</span></td>
                                <td className="px-4 py-3 text-center">
                                    <Link href={`/dashboard/production/orders/${o.id}`} className="text-blue-600 hover:text-blue-800" title="View">
                                        <Eye className="w-4 h-4 mx-auto" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
