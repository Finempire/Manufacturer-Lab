"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Package } from "lucide-react";
import { toast } from "sonner";

interface Requirement {
    id: string;
    status: string;
    required_by_date: string;
    special_instructions: string | null;
    created_at: string;
    order: { order_no: string };
    buyer: { name: string };
    style: { style_code: string; style_name: string };
    production_manager: { name: string };
    lines: { id: string; material_name: string; quantity: number; unit: string }[];
}

const STATUS_COLORS: Record<string, string> = {
    PENDING_STORE_ACCEPTANCE: "bg-amber-100 text-amber-800",
    ACCEPTED_BY_STORE: "bg-blue-100 text-blue-800",
    DECLINED_BY_STORE: "bg-red-100 text-red-800",
    REQUEST_RAISED: "bg-indigo-100 text-indigo-800",
    COMPLETED: "bg-green-100 text-green-800",
};

export default function AccountantMaterialNeedsPage() {
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/material-requirements")
            .then(r => r.json())
            .then(data => { setRequirements(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
    }, []);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">Material Needs</h1>
                <p className="text-sm text-slate-500 mt-1">Overview of all material requirements across orders</p>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Order</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Buyer</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Style</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">PM</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Items</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Required By</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                        ) : requirements.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center">
                                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500">No material requirements</p>
                            </td></tr>
                        ) : requirements.map(req => (
                            <tr key={req.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm font-medium text-slate-900">{req.order.order_no}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{req.buyer.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{req.style.style_code}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{req.production_manager.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600 text-center">{req.lines.length}</td>
                                <td className="px-4 py-3 text-sm text-slate-500">{format(new Date(req.required_by_date), "dd MMM yyyy")}</td>
                                <td className="px-4 py-3"><span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${STATUS_COLORS[req.status] || "bg-slate-100 text-slate-800"}`}>{req.status.replace(/_/g, " ")}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
