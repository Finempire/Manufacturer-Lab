"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface OrderOption { id: string; order_no: string; buyer: { id: string; name: string } }
interface StyleOption { id: string; style_code: string; style_name: string }
interface Line { material_name: string; description: string; quantity: string; unit: string }

export default function SamplePMNewMaterialNeedPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderOption[]>([]);
    const [styles, setStyles] = useState<StyleOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ order_id: "", buyer_id: "", style_id: "", required_by_date: "", special_instructions: "" });
    const [lines, setLines] = useState<Line[]>([{ material_name: "", description: "", quantity: "", unit: "meters" }]);

    useEffect(() => {
        fetch("/api/orders").then(r => r.json()).then(data => setOrders(Array.isArray(data) ? data : [])).catch(() => {});
        fetch("/api/master/styles").then(r => r.json()).then(setStyles).catch(() => {});
    }, []);

    const handleOrderChange = (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        setForm(prev => ({ ...prev, order_id: orderId, buyer_id: order?.buyer.id || "" }));
    };

    const handleLineChange = (i: number, field: string, value: string) => {
        const newLines = [...lines]; newLines[i] = { ...newLines[i], [field]: value }; setLines(newLines);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.order_id || !form.style_id || !form.required_by_date || lines.some(l => !l.material_name || !l.quantity)) {
            toast.error("Fill required fields"); return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/material-requirements", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, lines: lines.map(l => ({ ...l, quantity: parseFloat(l.quantity) })) }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Created");
            router.push("/dashboard/merchandiser/material-needs");
        } catch { toast.error("Failed"); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="max-w-3xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="p-2 bg-surface-1 border border-border rounded-lg hover:bg-surface-2 transition"><ArrowLeft className="w-5 h-5 text-foreground-secondary" /></button>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">New Material Requirement</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-surface-1 rounded-lg border border-border p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Order *</label>
                        <select required className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.order_id} onChange={e => handleOrderChange(e.target.value)}>
                            <option value="">Select Order</option>
                            {orders.map(o => <option key={o.id} value={o.id}>{o.order_no} — {o.buyer.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Style *</label>
                        <select required className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.style_id} onChange={e => setForm({ ...form, style_id: e.target.value })}>
                            <option value="">Select Style</option>
                            {styles.map(s => <option key={s.id} value={s.id}>{s.style_code} — {s.style_name}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">Required By Date *</label>
                    <input type="date" required className="w-full h-10 px-3 border border-border rounded-lg text-sm max-w-xs" value={form.required_by_date} onChange={e => setForm({ ...form, required_by_date: e.target.value })} />
                </div>

                <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">Special Instructions</label>
                    <textarea className="w-full p-3 border border-border rounded-lg text-sm" rows={2} value={form.special_instructions} onChange={e => setForm({ ...form, special_instructions: e.target.value })} />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Material Lines</h3>
                        <button type="button" onClick={() => setLines([...lines, { material_name: "", description: "", quantity: "", unit: "meters" }])} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"><Plus className="w-3.5 h-3.5" /> Add</button>
                    </div>
                    {lines.map((line, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-center">
                            <input type="text" required placeholder="Material *" className="col-span-4 h-9 px-3 border border-border rounded-lg text-sm" value={line.material_name} onChange={e => handleLineChange(i, "material_name", e.target.value)} />
                            <input type="text" placeholder="Description" className="col-span-3 h-9 px-3 border border-border rounded-lg text-sm" value={line.description} onChange={e => handleLineChange(i, "description", e.target.value)} />
                            <input type="number" required min="0.01" step="0.01" placeholder="Qty" className="col-span-2 h-9 px-3 border border-border rounded-lg text-sm" value={line.quantity} onChange={e => handleLineChange(i, "quantity", e.target.value)} />
                            <select className="col-span-2 h-9 px-2 border border-border rounded-lg text-sm" value={line.unit} onChange={e => handleLineChange(i, "unit", e.target.value)}>
                                <option value="meters">meters</option><option value="kg">kg</option><option value="pieces">pcs</option><option value="yards">yards</option>
                            </select>
                            <button type="button" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} disabled={lines.length === 1} className="col-span-1 text-red-400 hover:text-red-600 disabled:opacity-30 flex justify-center"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-secondary">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2.5 text-sm font-medium text-foreground-secondary bg-surface-1 border border-border rounded-lg hover:bg-surface-2">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? "Creating..." : "Submit"}</button>
                </div>
            </form>
        </div>
    );
}
