"use client";
import { ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";

interface Order { id: string; order_no: string; order_date: string; buyer: { name: string }; total_amount: number; status: string; }

export default function CeoOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    useEffect(() => { fetch("/api/orders").then(r => r.json()).then(setOrders).catch(() => { }); }, []);

    return (
        <div className="space-y-4">
            <div><h1 className="text-lg font-semibold tracking-tight text-foreground">All Orders</h1><p className="text-sm text-foreground-tertiary mt-1">Complete order overview</p></div>
            <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-surface-2">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Order</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Buyer</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-foreground-tertiary uppercase">Amount</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Status</th>
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
                                <td className="px-4 py-3 text-sm text-foreground text-right tabular-nums font-medium">₹{o.total_amount.toLocaleString("en-IN")}</td>
                                <td className="px-4 py-3"><span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-blue-100 text-blue-800">{o.status.replace(/_/g, " ")}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
