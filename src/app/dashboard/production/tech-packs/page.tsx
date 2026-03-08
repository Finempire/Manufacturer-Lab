"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { toast } from "sonner";

interface TechPack {
    id: string;
    tech_pack_no: string;
    status: string;
    fabric_details: string | null;
    revision_count: number;
    created_at: string;
    order: { order_no: string; buyer: { name: string } };
    merchandiser: { name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
    PENDING_PM_ACCEPTANCE: "bg-amber-100 text-amber-800", PM_ACCEPTED: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-purple-100 text-purple-800", SUBMITTED_FOR_REVIEW: "bg-orange-100 text-orange-800",
    PM_REVIEWING: "bg-orange-100 text-orange-800", SHARED_WITH_BUYER: "bg-cyan-100 text-cyan-800",
    BUYER_APPROVED: "bg-green-100 text-green-800", COMPLETED: "bg-green-100 text-green-800",
};

export default function ProductionTechPacksPage() {
    const [techPacks, setTechPacks] = useState<TechPack[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/techpacks")
            .then(r => r.json())
            .then(data => { setTechPacks(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
    }, []);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">Tech Packs</h1>
                <p className="text-sm text-slate-500 mt-1">Review and manage tech packs for your orders</p>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tech Pack No</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Order</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Merchandiser</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Revisions</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                            ) : techPacks.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center">
                                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500">No tech packs found</p>
                                </td></tr>
                            ) : techPacks.map(tp => (
                                <tr key={tp.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{tp.tech_pack_no}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{tp.order.order_no}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{tp.merchandiser?.name || "—"}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600 text-center">{tp.revision_count}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${STATUS_COLORS[tp.status] || "bg-slate-100 text-slate-800"}`}>
                                            {tp.status.replace(/_/g, " ")}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-500">{format(new Date(tp.created_at), "dd MMM yyyy")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
