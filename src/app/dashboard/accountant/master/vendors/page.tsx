"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Vendor { id: string; name: string; gstin: string | null; contact_person: string | null; phone: string | null; is_active: boolean; created_inline: boolean; }

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: "", gstin: "", contact_person: "", phone: "", address: "", notes: "" });

    const fetchVendors = () => {
        fetch("/api/master/vendors").then((r) => r.json()).then(setVendors).catch(() => toast.error("Failed to load vendors"));
    };

    useEffect(() => { fetchVendors(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/master/vendors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
        if (!res.ok) { toast.error("Failed to create vendor"); return; }
        toast.success("Vendor created");
        setShowModal(false);
        setForm({ name: "", gstin: "", contact_person: "", phone: "", address: "", notes: "" });
        fetchVendors();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900">Vendors</h1>
                    <p className="text-sm text-slate-500 mt-1">{vendors.length} vendors</p>
                </div>
                <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Add Vendor
                </button>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Contact</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">GSTIN</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {vendors.map((v) => (
                            <tr key={v.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                    {v.name}
                                    {v.created_inline && <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full">Inline</span>}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-500">{v.contact_person} {v.phone ? `(${v.phone})` : ""}</td>
                                <td className="px-4 py-3 text-sm text-slate-500 font-mono">{v.gstin || "—"}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${v.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                        {v.is_active ? "Active" : "Inactive"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Vendor</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Vendor Name *</label>
                                <input type="text" required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Contact Person</label>
                                    <input type="text" className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                                    <input type="text" className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">GSTIN</label>
                                <input type="text" className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
