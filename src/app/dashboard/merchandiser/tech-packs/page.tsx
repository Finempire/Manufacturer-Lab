"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { FileText, Eye, Filter } from "lucide-react";
import { toast } from "sonner";
import { SavedFilters } from "@/components/SavedFilters";

interface TechPack {
    id: string;
    tech_pack_no: string;
    status: string;
    fabric_details: string | null;
    trim_details: string | null;
    revision_count: number;
    created_at: string;
    order: { order_no: string; buyer: { name: string } };
}

const STATUS_COLORS: Record<string, string> = {
    PENDING_PM_ACCEPTANCE: "bg-amber-100 text-amber-800", PM_ACCEPTED: "bg-blue-100 text-blue-800",
    PENDING_MERCH_ACCEPTANCE: "bg-amber-100 text-amber-800", MERCH_ACCEPTED: "bg-indigo-100 text-indigo-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800", SUBMITTED_FOR_REVIEW: "bg-orange-100 text-orange-800",
    PM_REVIEWING: "bg-orange-100 text-orange-800", SHARED_WITH_BUYER: "bg-cyan-100 text-cyan-800",
    BUYER_APPROVED: "bg-green-100 text-green-800", BUYER_REJECTED: "bg-red-100 text-red-800",
    REVISION_IN_PROGRESS: "bg-yellow-100 text-yellow-800", COMPLETED: "bg-green-100 text-green-800",
};

export default function MerchandiserTechPacksPage() {
    const [techPacks, setTechPacks] = useState<TechPack[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [filters, setFilters] = useState<Record<string, unknown>>({});

    useEffect(() => {
        fetch("/api/techpacks")
            .then(r => r.json())
            .then(data => { setTechPacks(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { toast.error("Failed to load tech packs"); setLoading(false); });
    }, []);

    const handleApplyFilter = (f: Record<string, unknown>) => {
        setFilters(f);
        if (f.status) setStatusFilter(f.status as string);
        else setStatusFilter("");
    };

    const filteredTechPacks = techPacks.filter(tp => {
        if (statusFilter && tp.status !== statusFilter) return false;
        return true;
    });

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Tech Packs</h1>
                <p className="text-sm text-foreground-tertiary mt-1">View and manage your assigned tech packs</p>
            </div>

            {/* Filters */}
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
                <SavedFilters page="merchandiser-techpacks" currentFilters={filters} onApplyFilter={handleApplyFilter} />
            </div>

            <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-surface-2">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Tech Pack No</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Order</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Buyer</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Fabric</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-foreground-tertiary uppercase">Revisions</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-secondary">
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-foreground-muted">Loading...</td></tr>
                            ) : filteredTechPacks.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center">
                                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm text-foreground-tertiary">No tech packs assigned to you</p>
                                </td></tr>
                            ) : filteredTechPacks.map(tp => (
                                <tr key={tp.id} className="hover:bg-surface-2 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{tp.tech_pack_no}</td>
                                    <td className="px-4 py-3 text-sm text-foreground-secondary">{tp.order.order_no}</td>
                                    <td className="px-4 py-3 text-sm text-foreground-secondary">{tp.order.buyer.name}</td>
                                    <td className="px-4 py-3 text-sm text-foreground-tertiary max-w-[200px] truncate">{tp.fabric_details || "—"}</td>
                                    <td className="px-4 py-3 text-sm text-foreground-secondary text-center">{tp.revision_count}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${STATUS_COLORS[tp.status] || "bg-surface-3 text-foreground"}`}>
                                            {tp.status.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground-tertiary">{format(new Date(tp.created_at), "dd MMM yyyy")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
