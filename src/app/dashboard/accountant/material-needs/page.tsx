"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Package } from "lucide-react";
import { toast } from "sonner";
import { SavedFilters } from "@/components/SavedFilters";

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
    const [statusFilter, setStatusFilter] = useState("");
    const [filters, setFilters] = useState<Record<string, unknown>>({});

    useEffect(() => {
        fetch("/api/material-requirements")
            .then(r => r.json())
            .then(data => { setRequirements(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
    }, []);

    const handleApplyFilter = (f: Record<string, unknown>) => {
        setFilters(f);
        if (f.status) setStatusFilter(f.status as string);
        else setStatusFilter("");
    };

    const displayed = requirements.filter(r => {
        if (statusFilter && r.status !== statusFilter) return false;
        return true;
    });

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Material Needs</h1>
                <p className="text-sm text-foreground-tertiary mt-1">Overview of all material requirements across orders</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setFilters(prev => ({ ...prev, status: e.target.value || undefined })); }}
                    className="h-9 px-3 text-sm border border-border rounded-lg bg-surface-1"
                >
                    <option value="">All Statuses</option>
                    {Object.keys(STATUS_COLORS).map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                </select>
                <SavedFilters page="accountant-material-needs" currentFilters={filters} onApplyFilter={handleApplyFilter} />
            </div>

            <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-surface-2">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Order</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Buyer</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Style</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">PM</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-tertiary uppercase">Items</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Required By</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-secondary">
                        {loading ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-foreground-muted">Loading...</td></tr>
                        ) : displayed.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-12 text-center">
                                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-foreground-tertiary">No material requirements</p>
                            </td></tr>
                        ) : displayed.map(req => (
                            <tr key={req.id} className="hover:bg-surface-2">
                                <td className="px-4 py-3 text-sm font-medium text-foreground">{req.order.order_no}</td>
                                <td className="px-4 py-3 text-sm text-foreground-secondary">{req.buyer.name}</td>
                                <td className="px-4 py-3 text-sm text-foreground-secondary">{req.style.style_code}</td>
                                <td className="px-4 py-3 text-sm text-foreground-secondary">{req.production_manager.name}</td>
                                <td className="px-4 py-3 text-sm text-foreground-secondary text-center">{req.lines.length}</td>
                                <td className="px-4 py-3 text-sm text-foreground-tertiary">{format(new Date(req.required_by_date), "dd MMM yyyy")}</td>
                                <td className="px-4 py-3"><span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${STATUS_COLORS[req.status] || "bg-surface-3 text-foreground"}`}>{req.status.replace(/_/g, " ")}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
