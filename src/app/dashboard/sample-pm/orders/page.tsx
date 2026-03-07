"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Eye, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface Order {
    id: string;
    order_no: string;
    order_date: string;
    buyer: { name: string };
    order_type: string;
    status: string;
    merchandiser: { name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
    ORDER_RECEIVED: "bg-blue-100 text-blue-800", PENDING_PM_ACCEPTANCE: "bg-amber-100 text-amber-800",
    MERCHANDISER_ASSIGNED: "bg-indigo-100 text-indigo-800", TECH_PACK_IN_PROGRESS: "bg-purple-100 text-purple-800",
    UNDER_PRODUCTION: "bg-amber-100 text-amber-800", COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
};

export default function SamplePMOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/orders")
            .then(r => r.json())
            .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
    }, []);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Sample Orders</h1>
                <p className="text-sm text-gray-500 mt-1">{orders.length} orders</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Order No</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Buyer</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Merchandiser</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">View</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">Loading...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-12 text-center">
                                <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">No sample orders assigned</p>
                            </td></tr>
                        ) : orders.map(order => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{order.order_no}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(order.order_date), "dd MMM yyyy")}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{order.buyer.name}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{order.merchandiser?.name || "—"}</td>
                                <td className="px-4 py-3"><span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}`}>{order.status.replace(/_/g, " ")}</span></td>
                                <td className="px-4 py-3 text-center">
                                    <Link href={`/dashboard/sample-pm/orders/${order.id}`} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4 mx-auto" /></Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
