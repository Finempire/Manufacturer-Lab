"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, CheckCircle2, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";

interface Requirement {
    id: string;
    order_id: string;
    required_by_date: string;
    special_instructions: string | null;
    status: string;
    created_at: string;
    order: { order_no: string; order_type: string };
    buyer: { name: string };
    style: { style_code: string; style_name: string };
    production_manager: { name: string };
    store_manager: { name: string } | null;
    lines: {
        id: string;
        material_name: string;
        description: string | null;
        quantity: number;
        unit: string;
    }[];
}

const STATUS_COLORS: Record<string, string> = {
    PENDING_STORE_ACCEPTANCE: "bg-amber-100 text-amber-800",
    ACCEPTED_BY_STORE: "bg-green-100 text-green-800",
    REQUEST_SENT: "bg-blue-100 text-blue-800",
    PURCHASED: "bg-indigo-100 text-indigo-800",
    MATERIAL_RECEIVED: "bg-teal-100 text-teal-800",
    DECLINED: "bg-red-100 text-red-800",
};

type TabKey = "PENDING" | "ALL";

export default function RequirementsPage() {
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabKey>("PENDING");
    const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
    const [acting, setActing] = useState(false);

    const loadData = useCallback(() => {
        setLoading(true);
        const url = tab === "PENDING"
            ? "/api/material-requirements?status=PENDING_STORE_ACCEPTANCE"
            : "/api/material-requirements";
        fetch(url)
            .then((r) => r.json())
            .then((data) => setRequirements(Array.isArray(data) ? data : []))
            .catch(() => toast.error("Failed to load requirements"))
            .finally(() => setLoading(false));
    }, [tab]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAction = async (id: string, action: "accept" | "decline") => {
        setActing(true);
        try {
            const res = await fetch(`/api/material-requirements/${id}/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed");
            }
            toast.success(`Requirement ${action === "accept" ? "accepted" : "declined"} successfully`);
            setSelectedReq(null);
            loadData();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : `Failed to ${action}`);
        } finally {
            setActing(false);
        }
    };

    const tabs: { key: TabKey; label: string }[] = [
        { key: "PENDING", label: "Pending Acceptance" },
        { key: "ALL", label: "All Requirements" },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-gray-900">Material Requirements</h1>
                <p className="text-sm text-gray-500 mt-1">Review requirements from Production Managers</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                            tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : requirements.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">
                        {tab === "PENDING" ? "No material requirements pending acceptance" : "No material requirements found"}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Style</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PM</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Items</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required By</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requirements.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.order?.order_no}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{r.style?.style_code}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{r.buyer?.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{r.production_manager?.name}</td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-600">{r.lines?.length || 0}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {format(new Date(r.required_by_date), "dd MMM yyyy")}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-600"}`}>
                                                {r.status.replace(/_/g, " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(r.created_at), "dd MMM yyyy")}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setSelectedReq(r)}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Detail Drawer */}
            {selectedReq && (
                <>
                    <div className="fixed inset-0 bg-black/40 z-[40] backdrop-blur-sm" onClick={() => setSelectedReq(null)} />
                    <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[50] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Material Requirement</h2>
                                <p className="text-xs text-gray-500">Order: {selectedReq.order?.order_no} | Style: {selectedReq.style?.style_code}</p>
                            </div>
                            <button onClick={() => setSelectedReq(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                &times;
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-gray-500">Buyer</p><p className="text-sm font-medium">{selectedReq.buyer?.name}</p></div>
                                <div><p className="text-xs text-gray-500">Production Manager</p><p className="text-sm font-medium">{selectedReq.production_manager?.name}</p></div>
                                <div><p className="text-xs text-gray-500">Style</p><p className="text-sm font-medium">{selectedReq.style?.style_code} — {selectedReq.style?.style_name}</p></div>
                                <div><p className="text-xs text-gray-500">Required By</p><p className="text-sm font-medium">{format(new Date(selectedReq.required_by_date), "dd MMM yyyy")}</p></div>
                                <div><p className="text-xs text-gray-500">Status</p>
                                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md ${STATUS_COLORS[selectedReq.status] || "bg-gray-100 text-gray-600"}`}>
                                        {selectedReq.status.replace(/_/g, " ")}
                                    </span>
                                </div>
                                {selectedReq.store_manager && (
                                    <div><p className="text-xs text-gray-500">Assigned Store Manager</p><p className="text-sm font-medium">{selectedReq.store_manager.name}</p></div>
                                )}
                            </div>

                            {selectedReq.special_instructions && (
                                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                                    <p className="text-xs font-bold text-yellow-800 mb-1">Special Instructions</p>
                                    <p className="text-sm text-yellow-900">{selectedReq.special_instructions}</p>
                                </div>
                            )}

                            {/* Material Lines */}
                            {selectedReq.lines?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Material Lines</h3>
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedReq.lines.map((line) => (
                                                <tr key={line.id}>
                                                    <td className="px-3 py-2 text-sm text-gray-900">{line.material_name}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-600">{line.description || "—"}</td>
                                                    <td className="px-3 py-2 text-sm text-right tabular-nums">{line.quantity}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-600">{line.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Action Buttons - only for PENDING_STORE_ACCEPTANCE */}
                            {selectedReq.status === "PENDING_STORE_ACCEPTANCE" && (
                                <div className="flex gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleAction(selectedReq.id, "accept")}
                                        disabled={acting}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> {acting ? "Processing..." : "Accept Requirement"}
                                    </button>
                                    <button
                                        onClick={() => handleAction(selectedReq.id, "decline")}
                                        disabled={acting}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                                    >
                                        <XCircle className="w-4 h-4" /> {acting ? "Processing..." : "Decline"}
                                    </button>
                                </div>
                            )}

                            {/* Link to create material request if accepted */}
                            {selectedReq.status === "ACCEPTED_BY_STORE" && (
                                <div className="pt-4 border-t border-gray-200">
                                    <Link
                                        href={`/dashboard/manager/requests/new?requirement_id=${selectedReq.id}&order_id=${selectedReq.order_id}`}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                                    >
                                        Create Material Request
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
