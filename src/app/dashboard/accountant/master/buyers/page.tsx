"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Buyer {
    id: string;
    name: string;
    brand_code: string;
    contact_details: string | null;
    notes: string | null;
    created_inline: boolean;
    created_at: string;
}

export default function BuyersPage() {
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [filterInline, setFilterInline] = useState(false);
    const [form, setForm] = useState({ name: "", brand_code: "", contact_details: "", notes: "" });
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
        setForm({ name: "", brand_code: "", contact_details: "", notes: "" });
        setError("");
        fetchBuyers();
    };

    const displayed = filterInline ? buyers.filter(b => b.created_inline) : buyers;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Buyers</h1>
                    <p className="text-sm text-gray-500 mt-1">{buyers.length} buyers</p>
                </div>
                <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Add Buyer
                </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={filterInline}
                        onChange={(e) => setFilterInline(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Show Inline Created
                </label>
                {filterInline && (
                    <span className="text-xs text-gray-500">{displayed.length} of {buyers.length}</span>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Brand Code</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {displayed.map((b) => (
                            <tr key={b.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {b.name}
                                    {b.created_inline && <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full">Inline Added</span>}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500 font-mono">{b.brand_code}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{b.contact_details || "—"}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{b.notes || "—"}</td>
                            </tr>
                        ))}
                        {displayed.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
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
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Buyer</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
                            )}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Buyer Name *</label>
                                <input type="text" required className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Brand Code *</label>
                                <input type="text" required className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm uppercase" value={form.brand_code} onChange={(e) => setForm({ ...form, brand_code: e.target.value.toUpperCase() })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Contact Details</label>
                                <input type="text" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm" value={form.contact_details} onChange={(e) => setForm({ ...form, contact_details: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                                <textarea rows={2} className="w-full p-3 border border-gray-300 rounded-lg text-sm" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => { setShowModal(false); setError(""); }} className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
