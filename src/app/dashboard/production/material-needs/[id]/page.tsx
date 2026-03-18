"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface RequirementDetail {
    id: string;
    status: string;
    required_by_date: string;
    special_instructions: string | null;
    decline_reason: string | null;
    created_at: string;
    order: { order_no: string };
    buyer: { name: string };
    style: { style_code: string; style_name: string };
    production_manager: { name: string };
    store_manager: { name: string } | null;
    lines: { id: string; material_name: string; description: string | null; quantity: number; unit: string }[];
}

const STATUS_COLORS: Record<string, string> = {
    PENDING_STORE_ACCEPTANCE: "bg-amber-50 text-amber-800 border-amber-200",
    ACCEPTED_BY_STORE: "bg-blue-50 text-blue-800 border-blue-200",
    DECLINED_BY_STORE: "bg-red-50 text-red-800 border-red-200",
    REQUEST_RAISED: "bg-indigo-50 text-indigo-800 border-indigo-200",
    COMPLETED: "bg-green-50 text-green-800 border-green-200",
};

export default function ProductionMaterialNeedDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [req, setReq] = useState<RequirementDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/material-requirements/${params.id}`)
            .then(r => r.json())
            .then(data => { setReq(data); setLoading(false); })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
    }, [params.id]);

    if (loading) return <div className="text-center py-12 text-foreground-muted">Loading...</div>;
    if (!req) return <div className="text-center py-12 text-foreground-muted">Not found</div>;

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-surface-1 border border-border rounded-lg hover:bg-surface-2 transition">
                    <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">Material Requirement</h1>
                    <p className="text-sm text-foreground-tertiary mt-0.5">{req.order.order_no} &bull; {req.style.style_code}</p>
                </div>
                <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md border ${STATUS_COLORS[req.status] || "bg-surface-3 text-foreground border-border"}`}>
                    {req.status.replace(/_/g, " ")}
                </span>
            </div>

            <div className="bg-surface-1 rounded-lg border border-border p-5">
                <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide border-b pb-2">Details</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div><p className="text-xs text-foreground-tertiary mb-1">Buyer</p><p className="text-sm font-medium">{req.buyer.name}</p></div>
                    <div><p className="text-xs text-foreground-tertiary mb-1">Style</p><p className="text-sm font-medium">{req.style.style_code} — {req.style.style_name}</p></div>
                    <div><p className="text-xs text-foreground-tertiary mb-1">Required By</p><p className="text-sm font-medium">{format(new Date(req.required_by_date), "dd MMM yyyy")}</p></div>
                    <div><p className="text-xs text-foreground-tertiary mb-1">PM</p><p className="text-sm font-medium">{req.production_manager.name}</p></div>
                    {req.store_manager && <div><p className="text-xs text-foreground-tertiary mb-1">Store Manager</p><p className="text-sm font-medium">{req.store_manager.name}</p></div>}
                    {req.special_instructions && <div className="col-span-2"><p className="text-xs text-foreground-tertiary mb-1">Special Instructions</p><p className="text-sm text-foreground-secondary">{req.special_instructions}</p></div>}
                </div>
            </div>

            {req.decline_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-xs text-red-600 font-bold uppercase mb-1">Decline Reason</p>
                    <p className="text-sm text-red-800">{req.decline_reason}</p>
                </div>
            )}

            <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border-secondary bg-surface-2">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Material Lines</h3>
                </div>
                <table className="min-w-full divide-y divide-border-secondary">
                    <thead className="bg-surface-2">
                        <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground-tertiary uppercase">Material</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground-tertiary uppercase">Description</th>
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-foreground-tertiary uppercase">Qty</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground-tertiary uppercase">Unit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-secondary">
                        {req.lines.map(line => (
                            <tr key={line.id}>
                                <td className="px-4 py-2.5 text-sm font-medium text-foreground">{line.material_name}</td>
                                <td className="px-4 py-2.5 text-sm text-foreground-tertiary">{line.description || "—"}</td>
                                <td className="px-4 py-2.5 text-sm text-right tabular-nums">{line.quantity}</td>
                                <td className="px-4 py-2.5 text-sm text-foreground-secondary">{line.unit}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
