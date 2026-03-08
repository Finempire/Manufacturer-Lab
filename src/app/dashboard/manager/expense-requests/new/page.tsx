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

export default function ManagerNewExpensePage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [attachmentPath, setAttachmentPath] = useState("");
    const [form, setForm] = useState({
        order_id: "", buyer_id: "", expense_category: "JOB_WORK",
        job_work_type: "", description: "", vendor_name: "", expected_amount: "",
        expense_date: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {
        fetch("/api/orders").then(r => r.json()).then(data => setOrders(Array.isArray(data) ? data : [])).catch(() => {});
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.order_id || !form.description || !form.expected_amount) {
            toast.error("Please fill required fields"); return;
        }
        setSubmitting(true);
        try {
            const order = orders.find(o => o.id === form.order_id);
            const res = await fetch("/api/expenses", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form, expected_amount: parseFloat(form.expected_amount),
                    buyer_id: form.buyer_id || undefined,
                    attachment_path: attachmentPath || undefined,
                }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Expense request created");
            router.push("/dashboard/manager/expense-requests");
        } catch { toast.error("Failed to create expense request"); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="max-w-2xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">New Expense Request</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Order *</label>
                        <select required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm" value={form.order_id} onChange={e => setForm({ ...form, order_id: e.target.value })}>
                            <option value="">Select Order</option>
                            {orders.map(o => <option key={o.id} value={o.id}>{o.order_no} — {o.buyer.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Category *</label>
                        <select required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm" value={form.expense_category} onChange={e => setForm({ ...form, expense_category: e.target.value })}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Expense Date *</label>
                        <input type="date" required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Expected Amount *</label>
                        <input type="number" step="0.01" required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm" value={form.expected_amount} onChange={e => setForm({ ...form, expected_amount: e.target.value })} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Vendor Name</label>
                    <input type="text" className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm" value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Description *</label>
                    <textarea required className="w-full p-3 border border-slate-300 rounded-lg text-sm" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Attachment</label>
                    <FileUpload type="EXPENSE_ATTACHMENT" entityId="new" onUploadSuccess={path => setAttachmentPath(path)} />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50">{submitting ? "Creating..." : "Submit"}</button>
                </div>
            </form>
        </div>
    );
}
