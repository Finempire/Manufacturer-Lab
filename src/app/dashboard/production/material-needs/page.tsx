"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Package, Plus, Eye } from "lucide-react";
import { toast } from "sonner";

interface Requirement {
    id: string;
    status: string;
    required_by_date: string;
    created_at: string;
    order: { order_no: string };
    buyer: { name: string };
    style: { style_code: string; style_name: string };
    lines: { id: string }[];
}

const STATUS_COLORS: Record<string, string> = {
    PENDING_STORE_ACCEPTANCE: "bg-amber-100 text-amber-800",
    ACCEPTED_BY_STORE: "bg-blue-100 text-blue-800",
    DECLINED_BY_STORE: "bg-red-100 text-red-800",
    REQUEST_RAISED: "bg-indigo-100 text-indigo-800",
    COMPLETED: "bg-green-100 text-green-800",
};

export default function ProductionMaterialNeedsPage() {
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">Material Needs</h1>
                    <p className="text-sm text-foreground-tertiary mt-1">{requirements.length} requirements</p>
                </div>
                <Link href="/dashboard/production/material-needs/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> New Requirement
                </Link>
            </div>

            <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-surface-2">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Order</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Buyer</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Style</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-tertiary uppercase">Items</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Required By</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Status</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-tertiary uppercase">View</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-secondary">
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-foreground-muted">Loading...</td></tr>
                        ) : requirements.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center">
                                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-foreground-tertiary">No material requirements</p>
                            </td></tr>
                        ) : requirements.map(req => (
                            <tr key={req.id} className="hover:bg-surface-2">
                                <td className="px-4 py-3 text-sm font-medium text-foreground">{req.order.order_no}</td>
                                <td className="px-4 py-3 text-sm text-foreground-secondary">{req.buyer.name}</td>
                                <td className="px-4 py-3 text-sm text-foreground-secondary">{req.style.style_code}</td>
                                <td className="px-4 py-3 text-sm text-foreground-secondary text-center">{req.lines.length}</td>
                                <td className="px-4 py-3 text-sm text-foreground-tertiary">{format(new Date(req.required_by_date), "dd MMM yyyy")}</td>
                                <td className="px-4 py-3"><span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${STATUS_COLORS[req.status] || "bg-surface-3 text-foreground"}`}>{req.status.replace(/_/g, " ")}</span></td>
                                <td className="px-4 py-3 text-center">
                                    <Link href={`/dashboard/production/material-needs/${req.id}`} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4 mx-auto" /></Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
