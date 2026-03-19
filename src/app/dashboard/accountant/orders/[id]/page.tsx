"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, XCircle, Package } from "lucide-react";
import { toast } from "sonner";

interface OrderDetail {
    id: string;
    order_no: string;
    order_date: string;
    shipping_date: string;
    order_type: string;
    total_amount: number;
    remarks: string | null;
    status: string;
    buyer: { id: string; name: string; brand_code: string | null };
    creator: { name: string };
    assigned_sample_pm: { id: string; name: string } | null;
    assigned_production_pm: { id: string; name: string } | null;
    pm_accepted_by: { id: string; name: string } | null;
    lines: { id: string; style: { style_code: string; style_name: string }; description: string | null; quantity: number; rate: number; amount: number }[];
    material_requirements: { id: string; status: string }[];
    material_requests: { id: string; request_no: string; status: string; runner: { name: string } | null }[];
    expenses: { id: string; expense_no: string; status: string; expected_amount: number }[];
}

const STATUS_COLORS: Record<string, string> = {
    ORDER_RECEIVED: "bg-blue-100 text-blue-800 border-blue-200",
    REQUEST_RAISED: "bg-amber-100 text-amber-800 border-amber-200",
    INVOICE_SUBMITTED: "bg-indigo-100 text-indigo-800 border-indigo-200",
    APPROVED: "bg-teal-100 text-teal-800 border-teal-200",
    PAID: "bg-emerald-100 text-emerald-800 border-emerald-200",
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

export default function AccountantOrderDetail() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        fetch(`/api/orders/${params.id}`)
            .then(r => r.json())
            .then(data => { setOrder(data); setLoading(false); })
            .catch(() => { toast.error("Failed to load order"); setLoading(false); });
    }, [params.id]);

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel this order?")) return;
        setCancelling(true);
        try {
            const res = await fetch(`/api/orders/${params.id}/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: "Cancelled by accountant" }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Order cancelled");
            const updated = await fetch(`/api/orders/${params.id}`).then(r => r.json());
            setOrder(updated);
        } catch {
            toast.error("Failed to cancel order");
        } finally {
            setCancelling(false);
        }
    };

    if (loading) return <div className="text-center py-12 text-foreground-muted">Loading order...</div>;
    if (!order) return <div className="text-center py-12 text-foreground-muted">Order not found</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 bg-surface-1 border border-border rounded-lg hover:bg-surface-2 transition">
                    <ArrowLeft className="w-5 h-5 text-foreground-secondary" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">{order.order_no}</h1>
                    <p className="text-sm text-foreground-tertiary mt-0.5">{order.buyer.name} {order.buyer.brand_code ? `(${order.buyer.brand_code})` : ""} &bull; {order.order_type}</p>
                </div>
                <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md border ${STATUS_COLORS[order.status] || "bg-surface-3 text-foreground border-border"}`}>
                    {order.status.replace(/_/g, " ")}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Info Card */}
                    <div className="bg-surface-1 rounded-lg border border-border p-5">
                        <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide border-b pb-2">Order Information</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                            <div><p className="text-xs text-foreground-tertiary mb-1">Order Date</p><p className="text-sm font-medium">{format(new Date(order.order_date), "dd MMM yyyy")}</p></div>
                            <div><p className="text-xs text-foreground-tertiary mb-1">Shipping Date</p><p className="text-sm font-medium">{format(new Date(order.shipping_date), "dd MMM yyyy")}</p></div>
                            <div><p className="text-xs text-foreground-tertiary mb-1">Created By</p><p className="text-sm font-medium">{order.creator.name}</p></div>
                        </div>
                        {order.remarks && (
                            <div className="mt-4 pt-3 border-t border-border-secondary">
                                <p className="text-xs text-foreground-tertiary mb-1">Remarks</p>
                                <p className="text-sm text-foreground-secondary">{order.remarks}</p>
                            </div>
                        )}
                    </div>

                    {/* Item Lines */}
                    <div className="bg-surface-1 rounded-lg border border-border overflow-hidden">
                        <div className="px-5 py-3 border-b border-border-secondary bg-surface-2">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Item Lines</h3>
                        </div>
                        <table className="min-w-full divide-y divide-border-secondary">
                            <thead className="bg-surface-2">
                                <tr>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground-tertiary uppercase">Style</th>
                                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground-tertiary uppercase">Description</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-foreground-tertiary uppercase">Qty</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-foreground-tertiary uppercase">Rate</th>
                                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-foreground-tertiary uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-secondary">
                                {order.lines.map(line => (
                                    <tr key={line.id}>
                                        <td className="px-4 py-2.5 text-sm font-medium text-foreground">{line.style.style_code}</td>
                                        <td className="px-4 py-2.5 text-sm text-foreground-tertiary">{line.description || line.style.style_name}</td>
                                        <td className="px-4 py-2.5 text-sm text-foreground text-right tabular-nums">{line.quantity}</td>
                                        <td className="px-4 py-2.5 text-sm text-foreground text-right tabular-nums">₹{line.rate.toLocaleString("en-IN")}</td>
                                        <td className="px-4 py-2.5 text-sm font-medium text-foreground text-right tabular-nums">₹{line.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-surface-2">
                                <tr>
                                    <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-foreground-secondary">Total:</td>
                                    <td className="px-4 py-3 text-right text-sm font-bold text-foreground tabular-nums">₹{order.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Material Requests */}
                    {order.material_requests.length > 0 && (
                        <div className="bg-surface-1 rounded-lg border border-border p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Package className="w-4 h-4 text-orange-500" />
                                <h4 className="text-sm font-bold text-foreground">Material Requests ({order.material_requests.length})</h4>
                            </div>
                            <div className="space-y-2">
                                {order.material_requests.map(mr => (
                                    <div key={mr.id} className="flex items-center justify-between py-1.5 px-2 bg-surface-2 rounded-lg">
                                        <div>
                                            <span className="text-xs font-medium text-foreground-secondary">{mr.request_no}</span>
                                            {mr.runner && <span className="text-[10px] text-foreground-muted ml-1">({mr.runner.name})</span>}
                                        </div>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{mr.status.replace(/_/g, " ")}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Expenses */}
                    {order.expenses.length > 0 && (
                        <div className="bg-surface-1 rounded-lg border border-border p-4">
                            <h4 className="text-sm font-bold text-foreground mb-3">Expense Requests ({order.expenses.length})</h4>
                            <div className="space-y-2">
                                {order.expenses.map(exp => (
                                    <div key={exp.id} className="flex items-center justify-between py-1.5 px-2 bg-surface-2 rounded-lg">
                                        <span className="text-xs font-medium text-foreground-secondary">{exp.expense_no}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-foreground-secondary tabular-nums">₹{exp.expected_amount.toLocaleString("en-IN")}</span>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-3 text-foreground-secondary">{exp.status.replace(/_/g, " ")}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Actions */}
                <div className="space-y-6">
                    {/* Actions */}
                    <div className="bg-surface-1 rounded-lg border border-border p-4 space-y-3">
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">Actions</h4>

                        {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
                            <button onClick={handleCancel} disabled={cancelling} className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-1 text-red-600 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-50 transition disabled:opacity-50">
                                <XCircle className="w-4 h-4" /> {cancelling ? "Cancelling..." : "Cancel Order"}
                            </button>
                        )}

                        {order.status === "COMPLETED" && (
                            <div className="flex items-center gap-2 py-2 px-3 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700">Order Completed</span>
                            </div>
                        )}
                    </div>

                    {/* Assignments */}
                    <div className="bg-surface-1 rounded-lg border border-border p-4">
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">Assignments</h4>
                        <div className="space-y-3">
                            {order.order_type === "SAMPLE" && (
                                <div>
                                    <p className="text-xs text-foreground-tertiary">Senior Merchandiser</p>
                                    <p className="text-sm font-medium text-foreground">{order.assigned_sample_pm?.name || "—"}</p>
                                </div>
                            )}
                            {order.order_type === "PRODUCTION" && (
                                <div>
                                    <p className="text-xs text-foreground-tertiary">Production PM</p>
                                    <p className="text-sm font-medium text-foreground">{order.assigned_production_pm?.name || "—"}</p>
                                </div>
                            )}
                            {order.pm_accepted_by && (
                                <div>
                                    <p className="text-xs text-foreground-tertiary">PM Accepted By</p>
                                    <p className="text-sm font-medium text-foreground">{order.pm_accepted_by.name}</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
