"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";

interface OrderOption { id: string; order_no: string; buyer: { name: string } }

const CATEGORIES = [
    "JOB_WORK", "COURIER_SHIPPING", "LABOUR_OVERTIME", "MACHINE_REPAIR", "TESTING_LAB",
    "PACKAGING", "TRANSPORTATION", "WASHING_DYEING", "EMBROIDERY_PRINTING", "CUTTING_CHARGES",
    "FINISHING_CHARGES", "MISCELLANEOUS",
];

export default function SamplePMNewExpensePage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [attachmentPath, setAttachmentPath] = useState("");
    const [form, setForm] = useState({
        order_id: "", buyer_id: "", expense_category: "JOB_WORK",
        description: "", vendor_name: "", expected_amount: "",
        expense_date: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {
        fetch("/api/orders").then(r => r.json()).then(data => setOrders(Array.isArray(data) ? data : [])).catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.order_id || !form.description || !form.expected_amount) { toast.error("Fill required fields"); return; }
        setSubmitting(true);
        try {
            const res = await fetch("/api/expenses", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, expected_amount: parseFloat(form.expected_amount), attachment_path: attachmentPath || undefined }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Created");
            router.push("/dashboard/senior-merchandiser/expense-requests");
        } catch { toast.error("Failed"); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="max-w-2xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="p-2 bg-surface-1 border border-border rounded-lg hover:bg-surface-2 transition"><ArrowLeft className="w-5 h-5 text-foreground-secondary" /></button>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">New Expense Request</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-surface-1 rounded-lg border border-border p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Order *</label>
                        <select required className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.order_id} onChange={e => setForm({ ...form, order_id: e.target.value })}>
                            <option value="">Select Order</option>
                            {orders.map(o => <option key={o.id} value={o.id}>{o.order_no} — {o.buyer.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Category *</label>
                        <select required className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.expense_category} onChange={e => setForm({ ...form, expense_category: e.target.value })}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Date *</label>
                        <input type="date" required className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Expected Amount *</label>
                        <input type="number" step="0.01" required className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.expected_amount} onChange={e => setForm({ ...form, expected_amount: e.target.value })} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">Vendor Name</label>
                    <input type="text" className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} />
                </div>

                <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">Description *</label>
                    <textarea required className="w-full p-3 border border-border rounded-lg text-sm" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>

                <div>
                    <label className="block text-xs font-medium text-foreground-secondary mb-1">Attachment</label>
                    <FileUpload type="EXPENSE_ATTACHMENT" entityId="new" onUploadSuccess={path => setAttachmentPath(path)} />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border-secondary">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2.5 text-sm font-medium text-foreground-secondary bg-surface-1 border border-border rounded-lg hover:bg-surface-2">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50">{submitting ? "Creating..." : "Submit"}</button>
                </div>
            </form>
        </div>
    );
}
