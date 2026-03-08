"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import AddStyleModal from "@/components/AddStyleModal";

interface Buyer { id: string; name: string; brand_code: string; }
interface Order { id: string; order_no: string; lines?: { style_id: string; style?: { id: string; style_code: string; style_name: string } }[]; }
interface User { id: string; name: string; role: string; }
interface Vendor { id: string; name: string; }
interface Material { id: string; description: string; category: string; default_rate: number | null; }
interface StyleItem { id: string; style_code: string; style_name: string; }

interface Line { material_id: string; style_id: string; description: string; quantity: number | ""; expected_rate: number | ""; expected_amount: number; }

export default function MaterialRequestsPage() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Lookups
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [runners, setRunners] = useState<User[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [styles, setStyles] = useState<StyleItem[]>([]);
    const [orderStyles, setOrderStyles] = useState<StyleItem[]>([]);

    const [showStyleModal, setShowStyleModal] = useState(false);
    const [styleModalLineIndex, setStyleModalLineIndex] = useState<number>(0);

    const [formData, setFormData] = useState({
        buyer_id: "",
        order_id: "",
        store_location: "",
        expected_date: new Date().toISOString().split("T")[0],
        remarks: "",
        preferred_vendor_id: "",
        assigned_runner_id: ""
    });

    const [lines, setLines] = useState<Line[]>([{ material_id: "", style_id: "", description: "", quantity: "", expected_rate: "", expected_amount: 0 }]);

    const loadLookups = useCallback(() => {
        if (buyers.length === 0) fetch("/api/master/buyers").then(r => r.json()).then(setBuyers).catch(() => { });
        if (orders.length === 0) fetch("/api/orders").then(r => r.json()).then(setOrders).catch(() => { });
        if (runners.length === 0) fetch("/api/master/users?role=RUNNER").then(r => r.json()).then(setRunners).catch(() => { });
        if (vendors.length === 0) fetch("/api/master/vendors").then(r => r.json()).then(setVendors).catch(() => { });
        if (materials.length === 0) fetch("/api/master/materials").then(r => r.json()).then(setMaterials).catch(() => { });
        if (styles.length === 0) fetch("/api/master/styles").then(r => r.json()).then(setStyles).catch(() => { });
    }, [buyers.length, orders.length, runners.length, vendors.length, materials.length, styles.length]);

    // When order changes, extract its styles for priority listing
    useEffect(() => {
        if (formData.order_id) {
            const order = orders.find(o => o.id === formData.order_id);
            if (order?.lines) {
                const ols = order.lines
                    .filter(l => l.style)
                    .map(l => ({ id: l.style!.id, style_code: l.style!.style_code, style_name: l.style!.style_name }));
                // Deduplicate
                const unique = ols.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i);
                setOrderStyles(unique);
            } else {
                setOrderStyles([]);
            }
        } else {
            setOrderStyles([]);
        }
    }, [formData.order_id, orders]);

    const openDrawer = () => {
        setDrawerOpen(true);
        loadLookups();
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setFormData({
            buyer_id: "", order_id: "", store_location: "",
            expected_date: new Date().toISOString().split("T")[0],
            remarks: "", preferred_vendor_id: "", assigned_runner_id: ""
        });
        setLines([{ material_id: "", style_id: "", description: "", quantity: "", expected_rate: "", expected_amount: 0 }]);
    };

    const handleLineChange = (index: number, field: keyof Line, value: string | number) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };

        if (field === "material_id") {
            const mat = materials.find(m => m.id === value);
            if (mat) {
                newLines[index].description = mat.description;
                if (mat.default_rate) newLines[index].expected_rate = mat.default_rate;
            }
        }

        if (field === "quantity" || field === "expected_rate" || field === "material_id") {
            const qty = Number(newLines[index].quantity);
            const rate = Number(newLines[index].expected_rate);
            newLines[index].expected_amount = (qty && rate) ? qty * rate : 0;
        }

        setLines(newLines);
    };

    const handleStyleSelect = (index: number, value: string) => {
        if (value === "ADD_NEW_STYLE") {
            setStyleModalLineIndex(index);
            setShowStyleModal(true);
        } else {
            handleLineChange(index, "style_id", value);
        }
    };

    const totalAmount = lines.reduce((sum, line) => sum + line.expected_amount, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (lines.some(l => !l.material_id || !l.quantity || !l.expected_rate)) {
            toast.error("Please fill all line details");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                lines: lines.map(l => ({
                    ...l,
                    style_id: l.style_id || null,
                    quantity: Number(l.quantity),
                    expected_rate: Number(l.expected_rate)
                }))
            };

            const res = await fetch("/api/material-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create material request");
            toast.success("Material request created successfully!");
            closeDrawer();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to create material request");
        } finally {
            setSubmitting(false);
        }
    };

    // Compute styles: order-linked first, then other active styles
    const otherStyles = styles.filter(s => !orderStyles.some(os => os.id === s.id));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900">Material Requests</h1>
                    <p className="text-sm text-slate-500 mt-1">Create and manage material purchase requests</p>
                </div>
                <button
                    onClick={openDrawer}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> New Request
                </button>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-sm">No material requests created</p>
            </div>

            {/* Backdrop overlay */}
            {drawerOpen && (
                <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={closeDrawer} />
            )}

            {/* Side Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-3xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="text-lg font-bold text-slate-900">New Material Purchase Request</h2>
                        <button onClick={closeDrawer} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <form id="new-request-form" onSubmit={handleSubmit} className="space-y-6">
                            {/* General Details */}
                            <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900">General Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Buyer *</label>
                                        <select required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.buyer_id} onChange={(e) => setFormData({ ...formData, buyer_id: e.target.value })}>
                                            <option value="">Select Buyer</option>
                                            {buyers.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Order *</label>
                                        <select required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.order_id} onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}>
                                            <option value="">Select Order</option>
                                            {orders.map((o) => (<option key={o.id} value={o.id}>{o.order_no}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Store Location *</label>
                                        <input type="text" required placeholder="e.g. Main Warehouse" className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.store_location} onChange={(e) => setFormData({ ...formData, store_location: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Expected Date *</label>
                                        <input type="date" required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.expected_date} onChange={(e) => setFormData({ ...formData, expected_date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Runner *</label>
                                        <select required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.assigned_runner_id} onChange={(e) => setFormData({ ...formData, assigned_runner_id: e.target.value })}>
                                            <option value="">Select Runner</option>
                                            {runners.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Vendor (Optional)</label>
                                        <select className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.preferred_vendor_id} onChange={(e) => setFormData({ ...formData, preferred_vendor_id: e.target.value })}>
                                            <option value="">No Preference</option>
                                            {vendors.map((v) => (<option key={v.id} value={v.id}>{v.name}</option>))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Remarks</label>
                                    <textarea rows={2} placeholder="Any specific instructions..." className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
                                </div>
                            </div>

                            {/* Lines */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-slate-900">Material Items</h3>
                                    <button type="button" onClick={() => setLines([...lines, { material_id: "", style_id: "", description: "", quantity: "", expected_rate: "", expected_amount: 0 }])} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100">
                                        <Plus className="w-3.5 h-3.5" /> Add Material
                                    </button>
                                </div>
                                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase" style={{ minWidth: 150 }}>Material</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase" style={{ minWidth: 130 }}>Style</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase hidden md:table-cell" style={{ minWidth: 100 }}>Description</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase w-24">Qty</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase w-28">Exp. Rate</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase w-32">Amount</th>
                                                <th className="px-3 py-2 text-center text-xs font-medium text-slate-500 uppercase w-12">×</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {lines.map((line, i) => (
                                                <tr key={i}>
                                                    <td className="px-3 py-2">
                                                        <select required className="w-full h-8 px-2 border border-slate-300 rounded text-sm min-w-[150px]" value={line.material_id} onChange={(e) => handleLineChange(i, "material_id", e.target.value)}>
                                                            <option value="">Select...</option>
                                                            {materials.map(m => <option key={m.id} value={m.id}>{m.description}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <select className="w-full h-8 px-2 border border-slate-300 rounded text-sm min-w-[130px]" value={line.style_id} onChange={(e) => handleStyleSelect(i, e.target.value)}>
                                                            <option value="">Any / General</option>
                                                            {orderStyles.length > 0 && orderStyles.map(s => <option key={s.id} value={s.id}>{s.style_code} — {s.style_name}</option>)}
                                                            {orderStyles.length > 0 && otherStyles.length > 0 && <option disabled>─── Other Styles ───</option>}
                                                            {otherStyles.map(s => <option key={s.id} value={s.id}>{s.style_code} — {s.style_name}</option>)}
                                                            <option value="ADD_NEW_STYLE" className="text-blue-600 font-medium">+ Add New Style</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2 hidden md:table-cell">
                                                        <input type="text" className="w-full h-8 px-2 border border-slate-300 rounded text-sm" value={line.description} onChange={(e) => handleLineChange(i, "description", e.target.value)} />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="number" required min="0.1" step="0.1" className="w-full h-8 px-2 border border-slate-300 rounded text-sm text-right" value={line.quantity} onChange={(e) => handleLineChange(i, "quantity", e.target.value)} />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="number" required min="0" step="0.01" className="w-full h-8 px-2 border border-slate-300 rounded text-sm text-right" value={line.expected_rate} onChange={(e) => handleLineChange(i, "expected_rate", e.target.value)} />
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-sm font-medium tabular-nums">
                                                        ₹{line.expected_amount.toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button type="button" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} disabled={lines.length === 1} className="text-red-400 hover:text-red-600 disabled:opacity-30">
                                                            <Trash2 className="w-4 h-4 mx-auto" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50">
                                            <tr>
                                                <td colSpan={3} className="px-3 py-3 text-right text-sm font-semibold text-slate-700 hidden md:table-cell">Estimated Total Required:</td>
                                                <td colSpan={3} className="px-3 py-3 text-right text-sm font-bold text-slate-900 tabular-nums">₹{totalAmount.toFixed(2)}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
                        <button type="button" onClick={closeDrawer} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                        <button type="submit" form="new-request-form" disabled={submitting} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? "Submitting..." : "Submit Purchase Request"}</button>
                    </div>
                </div>
            </div>

            <AddStyleModal isOpen={showStyleModal} onClose={() => setShowStyleModal(false)} onSuccess={(style) => {
                setStyles((prev) => [...prev, { id: style.id, style_code: style.style_code, style_name: style.style_name }]);
                const newLines = [...lines];
                newLines[styleModalLineIndex] = { ...newLines[styleModalLineIndex], style_id: style.id };
                setLines(newLines);
                setShowStyleModal(false);
            }} />
        </div>
    );
}
