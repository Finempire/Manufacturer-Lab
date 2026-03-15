"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, ToggleLeft, ToggleRight, X } from "lucide-react";
import ExcelImport from "@/components/ExcelImport";
import { toast } from "sonner";

interface Style {
    id: string;
    style_code: string;
    style_name: string;
    category: string | null;
    description: string | null;
    is_active?: boolean;
    created_inline?: boolean;
}

export default function StylesMasterPage() {
    const [styles, setStyles] = useState<Style[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "active" | "inline">("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editStyle, setEditStyle] = useState<Style | null>(null);

    // Modal form
    const [formName, setFormName] = useState("");
    const [formCode, setFormCode] = useState("");
    const [formCategory, setFormCategory] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formError, setFormError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchStyles = useCallback(async () => {
        try {
            // Fetch all styles (active + inactive) for master page
            const res = await fetch("/api/master/styles");
            if (!res.ok) throw new Error();
            const data = await res.json();
            setStyles(data);
        } catch {
            toast.error("Failed to load styles");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStyles(); }, [fetchStyles]);

    const openAdd = () => {
        setEditStyle(null);
        setFormName(""); setFormCode(""); setFormCategory(""); setFormDescription(""); setFormError("");
        setModalOpen(true);
    };

    const openEdit = (s: Style) => {
        setEditStyle(s);
        setFormName(s.style_name); setFormCode(s.style_code); setFormCategory(s.category || ""); setFormDescription(s.description || ""); setFormError("");
        setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim() || formName.trim().length < 2) { setFormError("Style name required (min 2 chars)"); return; }
        if (!formCode.trim()) { setFormError("Style code required"); return; }

        setSubmitting(true); setFormError("");
        try {
            const payload = { style_name: formName.trim(), style_code: formCode.trim().toUpperCase(), category: formCategory.trim() || undefined, description: formDescription.trim() || undefined };
            const url = editStyle ? `/api/master/styles/${editStyle.id}` : "/api/master/styles";
            const method = editStyle ? "PUT" : "POST";

            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (res.status === 409) { const d = await res.json(); setFormError(d.error); return; }
            if (!res.ok) throw new Error();

            toast.success(editStyle ? "Style updated" : "Style created");
            setModalOpen(false);
            fetchStyles();
        } catch {
            setFormError("Failed to save style");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleActive = async (s: Style) => {
        try {
            if (s.is_active !== false) {
                await fetch(`/api/master/styles/${s.id}`, { method: "DELETE" });
                toast.success("Style deactivated");
            } else {
                await fetch(`/api/master/styles/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...s, is_active: true }) });
                toast.success("Style reactivated");
            }
            fetchStyles();
        } catch { toast.error("Failed to update style"); }
    };

    const filtered = styles.filter(s => {
        const matchSearch = !search || s.style_name.toLowerCase().includes(search.toLowerCase()) || s.style_code.toLowerCase().includes(search.toLowerCase());
        if (filter === "inline") return matchSearch && s.created_inline;
        if (filter === "active") return matchSearch && s.is_active !== false;
        return matchSearch;
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900">Styles</h1>
                    <p className="text-sm text-slate-500 mt-1">{styles.length} styles total</p>
                </div>
                <ExcelImport entityType="styles" onComplete={fetchStyles} />
                <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Add Style
                </button>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search by code or name..." className="w-full h-9 pl-9 pr-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                    {(["all", "active", "inline"] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                            {f === "all" ? "All" : f === "active" ? "Active Only" : "Inline Created"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Style Code</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Style Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Tags</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">No styles found</td></tr>
                            ) : filtered.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-900">{s.style_code}</td>
                                    <td className="px-4 py-3 text-sm text-slate-900">{s.style_name}</td>
                                    <td className="px-4 py-3 text-sm text-slate-500">{s.category || "—"}</td>
                                    <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate">{s.description || "—"}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex gap-1 justify-center flex-wrap">
                                            {s.created_inline && <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-100 text-purple-700 rounded-full">Inline Added</span>}
                                            {s.is_active === false && <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded-full">Inactive</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => openEdit(s)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                                            <button onClick={() => toggleActive(s)} className="text-slate-400 hover:text-amber-600 transition-colors" title={s.is_active !== false ? "Deactivate" : "Reactivate"}>
                                                {s.is_active !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                            <h3 className="text-sm font-bold text-slate-900">{editStyle ? "Edit Style" : "Add New Style"}</h3>
                            <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-4 space-y-3">
                            {formError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Style Name *</label>
                                <input type="text" required className="w-full h-9 px-3 border border-slate-300 rounded-lg text-sm" value={formName} onChange={(e) => setFormName(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Style Code *</label>
                                <input type="text" required className="w-full h-9 px-3 border border-slate-300 rounded-lg text-sm uppercase" value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase())} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                                <input type="text" className="w-full h-9 px-3 border border-slate-300 rounded-lg text-sm" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                                <textarea className="w-full p-3 border border-slate-300 rounded-lg text-sm" rows={2} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? "Saving..." : editStyle ? "Update" : "Save"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
