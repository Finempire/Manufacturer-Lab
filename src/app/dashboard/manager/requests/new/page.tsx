"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface OrderOption { id: string; order_no: string; buyer: { id: string; name: string } }
interface MaterialOption { id: string; description: string; category: string; unit_of_measure: string; default_rate: number | null }
interface VendorOption { id: string; name: string }
interface RunnerOption { id: string; name: string; runner_status: string }
interface Line { material_id: string; quantity: string; expected_rate: string }

export default function ManagerNewRequestPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderOption[]>([]);
    const [materials, setMaterials] = useState<MaterialOption[]>([]);
    const [vendors, setVendors] = useState<VendorOption[]>([]);
    const [runners, setRunners] = useState<RunnerOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        order_id: "", buyer_id: "", preferred_vendor_id: "", assigned_runner_id: "",
        store_location: "", expected_date: "", remarks: "",
    });
    const [lines, setLines] = useState<Line[]>([{ material_id: "", quantity: "", expected_rate: "" }]);

    useEffect(() => {
        fetch("/api/orders").then(r => r.json()).then(data => setOrders(Array.isArray(data) ? data : [])).catch(() => {});
        fetch("/api/master/materials").then(r => r.json()).then(setMaterials).catch(() => {});
        fetch("/api/master/vendors").then(r => r.json()).then(setVendors).catch(() => {});
        fetch("/api/admin/users?role=RUNNER").then(r => r.json()).then(data => setRunners(data.filter((u: { is_active: boolean }) => u.is_active))).catch(() => {});
    }, []);

    const handleOrderChange = (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        setForm(prev => ({ ...prev, order_id: orderId, buyer_id: order?.buyer.id || "" }));
    };

    const handleLineChange = (i: number, field: string, value: string) => {
        const newLines = [...lines];
        newLines[i] = { ...newLines[i], [field]: value };
        setLines(newLines);
    };

    const handleMaterialSelect = (i: number, materialId: string) => {
        const mat = materials.find(m => m.id === materialId);
        const newLines = [...lines];
        newLines[i] = { ...newLines[i], material_id: materialId, expected_rate: mat?.default_rate?.toString() || "" };
        setLines(newLines);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.order_id || !form.assigned_runner_id || lines.some(l => !l.material_id || !l.quantity)) {
            toast.error("Please fill required fields"); return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/material-requests", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    preferred_vendor_id: form.preferred_vendor_id || undefined,
                    lines: lines.map(l => ({
                        material_id: l.material_id,
                        quantity: parseFloat(l.quantity),
                        expected_rate: parseFloat(l.expected_rate || "0"),
                        expected_amount: parseFloat(l.quantity || "0") * parseFloat(l.expected_rate || "0"),
                    })),
                }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Material request created");
            router.push("/dashboard/manager/requests");
        } catch { toast.error("Failed to create request"); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="max-w-3xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">New Material Request</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Order *</label>
                        <select required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm" value={form.order_id} onChange={e => handleOrderChange(e.target.value)}>
                            <option value="">Select Order</option>
                            {orders.map(o => <option key={o.id} value={o.id}>{o.order_no} — {o.buyer.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Assign Runner *</label>
                        <select required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm" value={form.assigned_runner_id} onChange={e => setForm({ ...form, assigned_runner_id: e.target.value })}>
                            <option value="">Select Runner</option>
                            {runners.map(r => <option key={r.id} value={r.id}>{r.name} ({r.runner_status})</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Vendor</label>
                        <select className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm" value={form.preferred_vendor_id} onChange={e => setForm({ ...form, preferred_vendor_id: e.target.value })}>
                            <option value="">None</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Expected Date</label>
                        <input type="date" className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm" value={form.expected_date} onChange={e => setForm({ ...form, expected_date: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Store Location</label>
                        <input type="text" className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm" value={form.store_location} onChange={e => setForm({ ...form, store_location: e.target.value })} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Remarks</label>
                    <textarea className="w-full p-3 border border-slate-300 rounded-lg text-sm" rows={2} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
                </div>

                {/* Material Lines */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">Material Lines</h3>
                        <button type="button" onClick={() => setLines([...lines, { material_id: "", quantity: "", expected_rate: "" }])} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100">
                            <Plus className="w-3.5 h-3.5" /> Add Line
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Material</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Qty</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Rate</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                                    <th className="px-3 py-2 w-8"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lines.map((line, i) => (
                                    <tr key={i}>
                                        <td className="px-3 py-2">
                                            <select required className="w-full h-8 px-2 border border-slate-300 rounded text-sm" value={line.material_id} onChange={e => handleMaterialSelect(i, e.target.value)}>
                                                <option value="">Select Material</option>
                                                {materials.map(m => <option key={m.id} value={m.id}>{m.description} ({m.category})</option>)}
                                            </select>
                                        </td>
                                        <td className="px-3 py-2"><input type="number" required min="0.01" step="0.01" className="w-20 h-8 px-2 border border-slate-300 rounded text-sm text-right" value={line.quantity} onChange={e => handleLineChange(i, "quantity", e.target.value)} /></td>
                                        <td className="px-3 py-2"><input type="number" min="0" step="0.01" className="w-24 h-8 px-2 border border-slate-300 rounded text-sm text-right" value={line.expected_rate} onChange={e => handleLineChange(i, "expected_rate", e.target.value)} /></td>
                                        <td className="px-3 py-2 text-right text-sm font-medium tabular-nums">₹{(parseFloat(line.quantity || "0") * parseFloat(line.expected_rate || "0")).toFixed(2)}</td>
                                        <td className="px-3 py-2">
                                            <button type="button" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} disabled={lines.length === 1} className="text-red-400 hover:text-red-600 disabled:opacity-30">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? "Creating..." : "Create Request"}</button>
                </div>
            </form>
        </div>
    );
}
