import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface AddMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (materialId: string, materialDesc: string, defaultRate: number | null) => void;
}

export default function AddMaterialModal({ isOpen, onClose, onSuccess }: AddMaterialModalProps) {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        description: "",
        category: "FABRIC",
        unit_of_measure: "MTR",
        sku_code: "",
        default_rate: "",
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                created_inline: true,
                default_rate: formData.default_rate ? parseFloat(formData.default_rate) : null
            };

            const res = await fetch("/api/master/materials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to create material");

            const data = await res.json();
            toast.success("Material added successfully");
            onSuccess(data.id, data.description, data.default_rate);
            onClose();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to create material");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Add New Material</h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <form id="add-material-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Material Description *</label>
                            <input type="text" required autoFocus placeholder="e.g. Cotton Fabric 60\" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                                <select required className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option value="FABRIC">Fabric</option>
                                    <option value="TRIM">Trim / Accessary</option>
                                    <option value="THREAD">Thread</option>
                                    <option value="PACKAGING">Packaging</option>
                                    <option value="CONSUMABLE">Consumable</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Unit of Measure *</label>
                                <select required className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.unit_of_measure} onChange={e => setFormData({ ...formData, unit_of_measure: e.target.value })}>
                                    <option value="MTR">Meters</option>
                                    <option value="KG">Kilograms</option>
                                    <option value="PCS">Pieces</option>
                                    <option value="ROLL">Rolls</option>
                                    <option value="CON">Cones</option>
                                    <option value="PKT">Packets</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">SKU / Code</label>
                                <input type="text" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 uppercase" value={formData.sku_code} onChange={e => setFormData({ ...formData, sku_code: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Default Rate (₹)</label>
                                <input type="number" min="0" step="0.01" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.default_rate} onChange={e => setFormData({ ...formData, default_rate: e.target.value })} />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" form="add-material-form" disabled={submitting} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? "Saving..." : "Save & Select"}</button>
                </div>
            </div>
        </div>
    );
}
