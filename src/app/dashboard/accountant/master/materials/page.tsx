"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import ExcelImport from "@/components/ExcelImport";

interface Material { id: string; sku_code: string | null; description: string; category: string; unit_of_measure: string; default_rate: number | null; }

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ sku_code: "", description: "", category: "FABRIC", unit_of_measure: "MTR", default_rate: "" });

    const fetchMaterials = () => {
        fetch("/api/master/materials").then((r) => r.json()).then(setMaterials).catch(() => toast.error("Failed to load materials"));
    };

    useEffect(() => { fetchMaterials(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/master/materials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (!res.ok) { toast.error("Failed to create material"); return; }
        toast.success("Material created");
        setShowModal(false);
        setForm({ sku_code: "", description: "", category: "FABRIC", unit_of_measure: "MTR", default_rate: "" });
        fetchMaterials();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">Materials</h1>
                    <p className="text-sm text-foreground-tertiary mt-1">{materials.length} materials</p>
                </div>
                <div className="flex items-center gap-2">
                    <ExcelImport entityType="materials" onComplete={fetchMaterials} />
                    <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm">
                        <Plus className="w-4 h-4" /> Add Material
                    </button>
                </div>
            </div>

            <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-surface-2">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">SKU</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Description</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">UOM</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-foreground-tertiary uppercase">Rate</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-secondary">
                        {materials.map((m) => (
                            <tr key={m.id} className="hover:bg-surface-2">
                                <td className="px-4 py-3 text-sm font-mono text-foreground-tertiary">{m.sku_code || "—"}</td>
                                <td className="px-4 py-3 text-sm font-medium text-foreground">{m.description}</td>
                                <td className="px-4 py-3"><span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-surface-3 text-foreground-secondary">{m.category}</span></td>
                                <td className="px-4 py-3 text-sm text-foreground-tertiary">{m.unit_of_measure}</td>
                                <td className="px-4 py-3 text-sm text-foreground text-right tabular-nums">{m.default_rate ? `₹${m.default_rate.toFixed(2)}` : "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
                    <div className="bg-surface-1 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Add New Material</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-foreground-secondary mb-1">SKU Code</label>
                                    <input type="text" className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.sku_code} onChange={(e) => setForm({ ...form, sku_code: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-foreground-secondary mb-1">Category *</label>
                                    <select className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                        <option value="FABRIC">Fabric</option>
                                        <option value="TRIM">Trim</option>
                                        <option value="CONSUMABLE">Consumable</option>
                                        <option value="PACKAGING">Packaging</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-1">Description *</label>
                                <input type="text" required className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-foreground-secondary mb-1">Unit of Measure *</label>
                                    <select className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.unit_of_measure} onChange={(e) => setForm({ ...form, unit_of_measure: e.target.value })}>
                                        <option value="MTR">Meter (MTR)</option>
                                        <option value="KG">Kilogram (KG)</option>
                                        <option value="PCS">Pieces (PCS)</option>
                                        <option value="GRS">Gross (GRS)</option>
                                        <option value="CON">Cone (CON)</option>
                                        <option value="SET">Set (SET)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-foreground-secondary mb-1">Default Rate</label>
                                    <input type="number" step="0.01" className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.default_rate} onChange={(e) => setForm({ ...form, default_rate: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-foreground-secondary border border-border rounded-lg hover:bg-surface-2">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
