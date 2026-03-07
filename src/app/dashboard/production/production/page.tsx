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

export default function ProductionInterfacePage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/orders")
            .then(r => r.json())
            .then(data => {
                const productionOrders = (Array.isArray(data) ? data : []).filter((o: Order) => PRODUCTION_STATUSES.includes(o.status));
                setOrders(productionOrders);
                setLoading(false);
            })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
    }, []);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Production</h1>
                <p className="text-sm text-gray-500 mt-1">Orders currently in production pipeline</p>
            </div>

            {/* Status summary cards */}
            <div className="grid grid-cols-3 gap-4">
                {PRODUCTION_STATUSES.map(status => {
                    const count = orders.filter(o => o.status === status).length;
                    return (
                        <div key={status} className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{status.replace(/_/g, " ")}</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order No</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Buyer</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Shipping Date</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Total Qty</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">View</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">Loading...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center">
                                <Factory className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">No orders in production</p>
                            </td></tr>
                        ) : orders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{order.order_no}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{order.buyer.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(order.order_date), "dd MMM yyyy")}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(order.shipping_date), "dd MMM yyyy")}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-center tabular-nums">{order.lines.reduce((s, l) => s + l.quantity, 0)}</td>
                                <td className="px-4 py-3"><span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>{order.status.replace(/_/g, " ")}</span></td>
                                <td className="px-4 py-3 text-center">
                                    <Link href={`/dashboard/production/orders/${order.id}`} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4 mx-auto" /></Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
