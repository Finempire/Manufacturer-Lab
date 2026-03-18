"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import ExcelImport from "@/components/ExcelImport";

interface Buyer {
    id: string;
    name: string;
    brand_code: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    shipping_address: string | null;
    notes: string | null;
    created_inline: boolean;
    created_at: string;
}

export default function BuyersPage() {
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [filterInline, setFilterInline] = useState(false);
    const [form, setForm] = useState({ name: "", brand_code: "", contact_person: "", phone: "", shipping_address: "", notes: "" });
    const [error, setError] = useState("");

    const fetchBuyers = () => {
        fetch("/api/master/buyers").then((r) => r.json()).then(setBuyers).catch(() => toast.error("Failed to load buyers"));
    };

    useEffect(() => { fetchBuyers(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const res = await fetch("/api/master/buyers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        if (res.status === 409) {
            const data = await res.json();
            setError(data.error || "A buyer with this name already exists");
            return;
        }
        if (!res.ok) { toast.error("Failed to create buyer"); return; }
        toast.success("Buyer created");
        setShowModal(false);
        setForm({ name: "", brand_code: "", contact_person: "", phone: "", shipping_address: "", notes: "" });
        setError("");
        fetchBuyers();
    };

    const displayed = filterInline ? buyers.filter(b => b.created_inline) : buyers;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">Buyers</h1>
                    <p className="text-sm text-foreground-tertiary mt-1">{buyers.length} buyers</p>
                </div>
                <div className="flex items-center gap-2">
                    <ExcelImport entityType="buyers" onComplete={fetchBuyers} />
                    <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Add Buyer
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-foreground-secondary cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={filterInline}
                        onChange={(e) => setFilterInline(e.target.checked)}
                        className="rounded border-border text-blue-600 focus:ring-blue-500"
                    />
                    Show Inline Created
                </label>
                {filterInline && (
                    <span className="text-xs text-foreground-tertiary">{displayed.length} of {buyers.length}</span>
                )}
            </div>

            <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-surface-2">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Brand Code</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Contact</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Shipping Address</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-foreground-tertiary uppercase">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-secondary">
                        {displayed.map((b) => (
                            <tr key={b.id} className="hover:bg-surface-2">
                                <td className="px-4 py-3 text-sm font-medium text-foreground">
                                    {b.name}
                                    {b.created_inline && <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full">Inline Added</span>}
                                </td>
                                <td className="px-4 py-3 text-sm text-foreground-tertiary font-mono">{b.brand_code}</td>
                                <td className="px-4 py-3 text-sm text-foreground-tertiary">{[b.contact_person, b.phone].filter(Boolean).join(" | ") || "—"}</td>
                                <td className="px-4 py-3 text-sm text-foreground-tertiary">{b.shipping_address || "—"}</td>
                                <td className="px-4 py-3 text-sm text-foreground-tertiary">{b.notes || "—"}</td>
                            </tr>
                        ))}
                        {displayed.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-sm text-foreground-muted">
                                    {filterInline ? "No inline-created buyers found" : "No buyers found"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
                    <div className="bg-surface-1 rounded-lg shadow-xl max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Add New Buyer</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
                            )}
                            <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-1">Buyer Name *</label>
                                <input type="text" required className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-1">Brand Code *</label>
                                <input type="text" required className="w-full h-10 px-3 border border-border rounded-lg text-sm uppercase" value={form.brand_code} onChange={(e) => setForm({ ...form, brand_code: e.target.value.toUpperCase() })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-1">Contact Person</label>
                                <input type="text" className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-1">Phone</label>
                                <input type="text" className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-1">Shipping Address</label>
                                <textarea rows={2} placeholder="Full shipping address" className="w-full p-3 border border-border rounded-lg text-sm" value={form.shipping_address} onChange={(e) => setForm({ ...form, shipping_address: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-1">Notes</label>
                                <textarea rows={2} className="w-full p-3 border border-border rounded-lg text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => { setShowModal(false); setError(""); }} className="px-4 py-2 text-sm text-foreground-secondary border border-border rounded-lg hover:bg-surface-2">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
