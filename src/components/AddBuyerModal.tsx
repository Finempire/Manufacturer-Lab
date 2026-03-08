"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface AddBuyerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (buyer: { id: string; name: string; brand_code: string | null }) => void;
}

export default function AddBuyerModal({ isOpen, onClose, onSuccess }: AddBuyerModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        brand_code: "",
        contact_person: "",
        phone_email: "",
        notes: "",
    });

    if (!isOpen) return null;

    const validate = () => {
        if (!formData.name || formData.name.trim().length < 2) {
            setError("Buyer name is required (min 2 characters)");
            return false;
        }
        if (formData.brand_code && formData.brand_code.length > 10) {
            setError("Brand code must be 10 characters or less");
            return false;
        }
        setError("");
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        setError("");
        try {
            const res = await fetch("/api/master/buyers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    brand_code: formData.brand_code || undefined,
                    contact_person: formData.contact_person || undefined,
                    phone: formData.phone_email || undefined,
                    notes: formData.notes || undefined,
                    created_inline: true,
                }),
            });

            if (res.status === 409) {
                const data = await res.json();
                setError(data.error || "A buyer with this name already exists");
                return;
            }

            if (!res.ok) throw new Error("Failed to create buyer");

            const buyer = await res.json();
            toast.success("Buyer added and selected");
            onSuccess({ id: buyer.id, name: buyer.name, brand_code: buyer.brand_code });
            // Reset form
            setFormData({ name: "", brand_code: "", contact_person: "", phone_email: "", notes: "" });
            onClose();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to create buyer");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Add New Buyer</h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <form id="add-buyer-form" onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Buyer Name *</label>
                            <input
                                type="text"
                                required
                                autoFocus
                                className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Brand Code</label>
                            <input
                                type="text"
                                maxLength={10}
                                placeholder="Short code like HM-IN, ZARA-UK"
                                className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase placeholder:normal-case"
                                value={formData.brand_code}
                                onChange={(e) => setFormData({ ...formData, brand_code: e.target.value.toUpperCase() })}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Optional — auto-generated if left blank</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Contact Person</label>
                            <input
                                type="text"
                                className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.contact_person}
                                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Phone / Email</label>
                            <input
                                type="text"
                                className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.phone_email}
                                onChange={(e) => setFormData({ ...formData, phone_email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                            <textarea
                                rows={2}
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </form>
                </div>

                <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" form="add-buyer-form" disabled={submitting} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {submitting ? "Saving..." : "Save & Select"}
                    </button>
                </div>
            </div>
        </div>
    );
}
