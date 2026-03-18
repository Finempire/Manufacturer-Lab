"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";

interface OrderOption { id: string; order_no: string; buyer: { name: string } }
interface BuyerOption { id: string; name: string }
interface StyleOption { id: string; style_code: string; style_name: string }

const CATEGORIES = [
    "JOB_WORK", "COURIER_SHIPPING", "LABOUR_OVERTIME", "MACHINE_REPAIR", "TESTING_LAB",
    "PACKAGING", "TRANSPORTATION", "WASHING_DYEING", "EMBROIDERY_PRINTING", "CUTTING_CHARGES",
    "FINISHING_CHARGES", "MISCELLANEOUS",
];

export default function NewExpenseRequestPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderOption[]>([]);
    const [buyers, setBuyers] = useState<BuyerOption[]>([]);
    const [styles, setStyles] = useState<StyleOption[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [attachmentPath, setAttachmentPath] = useState("");
    const [form, setForm] = useState({
        order_id: "", buyer_id: "", style_id: "", expense_category: "JOB_WORK",
        job_work_type: "", description: "", vendor_name: "", expected_amount: "",
        expense_date: new Date().toISOString().split("T")[0],
    });

    useEffect(() => {
        fetch("/api/orders").then(r => r.json()).then(data => setOrders(Array.isArray(data) ? data : [])).catch(() => {});
        fetch("/api/master/buyers").then(r => r.json()).then(setBuyers).catch(() => {});
        fetch("/api/master/styles").then(r => r.json()).then(setStyles).catch(() => {});
    }, []);

    const handleOrderChange = (orderId: string) => {
        setForm(prev => ({ ...prev, order_id: orderId }));
        const order = orders.find(o => o.id === orderId);
        if (order) {
            const buyer = buyers.find(b => b.name === order.buyer.name);
            if (buyer) setForm(prev => ({ ...prev, buyer_id: buyer.id }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.order_id || !form.buyer_id || !form.description || !form.expected_amount) {
            toast.error("Please fill in all required fields");
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch("/api/expenses", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    expected_amount: parseFloat(form.expected_amount),
                    attachment_path: attachmentPath || undefined,
                    style_id: form.style_id || undefined,
                    job_work_type: form.job_work_type || undefined,
                }),
            });
            if (!res.ok) throw new Error("Failed to create expense request");
            toast.success("Expense request created");
            router.push("/dashboard/accountant/expense-requests");
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to create");
        } finally { setSubmitting(false); }
    };

    return (
        <div className="max-w-2xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => router.back()} className="p-2 bg-surface-1 border border-border rounded-lg hover:bg-surface-2 transition">
                    <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
                </button>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">New Expense Request</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-surface-1 rounded-lg border border-border p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Order *</label>
                        <select required className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.order_id} onChange={e => handleOrderChange(e.target.value)}>
                            <option value="">Select Order</option>
                            {orders.map(o => <option key={o.id} value={o.id}>{o.order_no} — {o.buyer.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Buyer *</label>
                        <select required className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.buyer_id} onChange={e => setForm({ ...form, buyer_id: e.target.value })}>
                            <option value="">Select Buyer</option>
                            {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Category *</label>
                        <select required className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.expense_category} onChange={e => setForm({ ...form, expense_category: e.target.value })}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Expense Date *</label>
                        <input type="date" required className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Expected Amount *</label>
                        <input type="number" step="0.01" required className="w-full h-10 px-3 border border-border rounded-lg text-sm" placeholder="₹0.00" value={form.expected_amount} onChange={e => setForm({ ...form, expected_amount: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Style</label>
                        <select className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.style_id} onChange={e => setForm({ ...form, style_id: e.target.value })}>
                            <option value="">None</option>
                            {styles.map(s => <option key={s.id} value={s.id}>{s.style_code} — {s.style_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Vendor Name</label>
                        <input type="text" className="w-full h-10 px-3 border border-border rounded-lg text-sm" value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })} />
                    </div>
                </div>

                {form.expense_category === "JOB_WORK" && (
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Job Work Type</label>
                        <input type="text" className="w-full h-10 px-3 border border-border rounded-lg text-sm" placeholder="e.g. Embroidery, Printing" value={form.job_work_type} onChange={e => setForm({ ...form, job_work_type: e.target.value })} />
                    </div>
                )}

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
                    <button type="submit" disabled={submitting} className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50">{submitting ? "Creating..." : "Create Expense Request"}</button>
                </div>
            </form>
        </div>
    );
}
