import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface AddVendorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (vendorId: string, vendorName: string) => void;
}

export default function AddVendorModal({ isOpen, onClose, onSuccess }: AddVendorModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        contact_person: "",
        phone: "",
        address: "",
        gstin: "",
        notes: "",
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/master/vendors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, created_inline: true }),
            });

            if (!res.ok) throw new Error("Failed to create vendor");

            const data = await res.json();
            toast.success("Vendor added successfully");
            onSuccess(data.id, data.name);
            onClose();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to create vendor");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">Add New Vendor</h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <form id="add-vendor-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Vendor Name *</label>
                            <input type="text" required autoFocus className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Contact Person</label>
                                <input type="text" className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.contact_person} onChange={e => setFormData({ ...formData, contact_person: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                                <input type="text" className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">GSTIN</label>
                            <input type="text" className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 uppercase" value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Address / Market</label>
                            <input type="text" className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                            <textarea rows={2} className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                        </div>
                    </form>
                </div>

                <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                    <button type="submit" form="add-vendor-form" disabled={submitting} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? "Saving..." : "Save & Select"}</button>
                </div>
            </div>
        </div>
    );
}
