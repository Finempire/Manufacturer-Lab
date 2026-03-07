"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface AddStyleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (style: { id: string; style_code: string; style_name: string; category?: string }) => void;
}

export default function AddStyleModal({ isOpen, onClose, onSuccess }: AddStyleModalProps) {
    const [styleName, setStyleName] = useState("");
    const [styleCode, setStyleCode] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!styleName.trim() || styleName.trim().length < 2) { setError("Style name is required (min 2 chars)"); return; }
        if (!styleCode.trim()) { setError("Style code is required"); return; }

        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/master/styles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    style_name: styleName.trim(),
                    style_code: styleCode.trim().toUpperCase(),
                    category: category.trim() || undefined,
                    description: description.trim() || undefined,
                    created_inline: true,
                }),
            });
            if (res.status === 409) {
                const data = await res.json();
                setError(data.error || "Style already exists");
                return;
            }
            if (!res.ok) throw new Error("Failed to create style");
            const style = await res.json();
            toast.success("Style added and selected");
            onSuccess(style);
            setStyleName(""); setStyleCode(""); setCategory(""); setDescription(""); setError("");
        } catch {
            setError("Failed to create style");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900">Add New Style</h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                    {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Style Name *</label>
                        <input type="text" required className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. Men's Formal Shirt" value={styleName} onChange={(e) => setStyleName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Style Code *</label>
                        <input type="text" required className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. ST-001, SHIRT-001" value={styleCode} onChange={(e) => setStyleCode(e.target.value.toUpperCase())} />
                        <p className="text-[10px] text-gray-400 mt-0.5">Auto-uppercased. Must be unique.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                        <input type="text" className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. Shirt, Trouser, Jacket" value={category} onChange={(e) => setCategory(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <textarea className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={2} placeholder="Optional notes..." value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? "Saving..." : "Save & Select"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
