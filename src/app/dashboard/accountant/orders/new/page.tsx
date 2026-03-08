"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useColumnResize } from "@/hooks/useColumnResize";
import AddBuyerModal from "@/components/AddBuyerModal";
import AddStyleModal from "@/components/AddStyleModal";

interface Buyer { id: string; name: string; brand_code: string; }
interface StyleItem { id: string; style_code: string; style_name: string; }
interface Line { style_id: string; description: string; quantity: number; rate: number; amount: number; }

const INITIAL_COL_WIDTHS = { style: 160, description: 160, qty: 80, rate: 100, amount: 110 };

export default function NewOrder() {
    const router = useRouter();
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [styles, setStyles] = useState<StyleItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showBuyerModal, setShowBuyerModal] = useState(false);
    const [showStyleModal, setShowStyleModal] = useState(false);
    const [styleModalLineIndex, setStyleModalLineIndex] = useState<number>(0);
    const [orderNo, setOrderNo] = useState("");
    const [formData, setFormData] = useState({
        buyer_id: "", order_date: new Date().toISOString().split("T")[0], shipping_date: "", order_type: "PRODUCTION", remarks: "",
    });
    const [lines, setLines] = useState<Line[]>([{ style_id: "", description: "", quantity: 0, rate: 0, amount: 0 }]);
    const { widths, startResize } = useColumnResize(INITIAL_COL_WIDTHS);

    useEffect(() => {
        fetch("/api/master/buyers").then((r) => r.json()).then(setBuyers).catch(() => toast.error("Failed to load buyers"));
        fetch("/api/master/styles").then((r) => r.json()).then(setStyles).catch(() => toast.error("Failed to load styles"));
        fetch("/api/orders?last=true")
            .then((r) => r.json())
            .then((data) => {
                if (data?.order_no) {
                    const parts = data.order_no.split("-");
                    const seq = parseInt(parts[2] || "0", 10) + 1;
                    setOrderNo(`ORD-2026-${String(seq).padStart(4, "0")}`);
                } else {
                    setOrderNo("ORD-2026-0001");
                }
            })
            .catch(() => setOrderNo("ORD-2026-0001"));
    }, []);

    const handleLineChange = (index: number, field: string, value: string | number) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };
        if (field === "quantity" || field === "rate") {
            newLines[index].amount = Number(newLines[index].quantity) * Number(newLines[index].rate);
        }
        setLines(newLines);
    };

    const handleStyleSelect = (index: number, value: string) => {
        if (value === "ADD_NEW_STYLE") {
            setStyleModalLineIndex(index);
            setShowStyleModal(true);
        } else {
            handleLineChange(index, "style_id", value);
        }
    };

    const totalAmount = lines.reduce((sum, line) => sum + line.amount, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (lines.some(l => !l.style_id)) {
            toast.error("Please select a style for each item line");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, order_no: orderNo, lines }),
            });
            if (!res.ok) throw new Error("Failed to create order");
            toast.success("Order created successfully");
            router.push("/dashboard/accountant/orders");
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to create order");
            setLoading(false);
        }
    };

    const handleBuyerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === "ADD_NEW") {
            setShowBuyerModal(true);
        } else {
            setFormData({ ...formData, buyer_id: e.target.value });
        }
    };

    const ResizeHandle = ({ colKey }: { colKey: string }) => (
        <div
            onMouseDown={(ev) => startResize(colKey, ev)}
            style={{
                position: "absolute", right: -4, top: 4, bottom: 4, width: "8px",
                cursor: "col-resize", userSelect: "none", zIndex: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="Drag to resize"
        >
            <div style={{ width: "2px", height: "100%", borderRadius: "1px" }} className="bg-gray-300 hover:bg-blue-500 active:bg-blue-500 transition-colors" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">Create New Order</h1>
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-slate-200">
                {/* Row 1: Order Type | Buyer + Add New */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Order Type *</label>
                        <select required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={formData.order_type} onChange={(e) => setFormData({ ...formData, order_type: e.target.value })}>
                            <option value="PRODUCTION">Production</option>
                            <option value="SAMPLE">Sample</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Buyer *</label>
                        <select required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={formData.buyer_id} onChange={handleBuyerChange}>
                            <option value="">Select Buyer</option>
                            {buyers.map((b) => (<option key={b.id} value={b.id}>{b.name} ({b.brand_code})</option>))}
                            <option value="ADD_NEW" className="text-blue-600 font-medium">+ Add New Buyer</option>
                        </select>
                    </div>
                </div>

                {/* Row 2: Order No | Order Date | Shipping Date */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Order No</label>
                        <input type="text" placeholder="Auto-generated" className="w-full h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Order Date *</label>
                        <input type="date" required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={formData.order_date} onChange={(e) => setFormData({ ...formData, order_date: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Shipping Date *</label>
                        <input type="date" required className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={formData.shipping_date} onChange={(e) => setFormData({ ...formData, shipping_date: e.target.value })} />
                    </div>
                </div>

                {/* Row 3: Remarks */}
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Remarks</label>
                    <textarea className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={2} value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
                </div>

                {/* Item Lines with resizable columns + style dropdown */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">Item Lines</h3>
                        <button type="button" onClick={() => setLines([...lines, { style_id: "", description: "", quantity: 0, rate: 0, amount: 0 }])} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100">
                            <Plus className="w-3.5 h-3.5" /> Add Line
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200" style={{ tableLayout: "fixed" }}>
                            <thead className="bg-slate-50">
                                <tr>
                                    <th style={{ width: widths.style, minWidth: 120, position: "relative" }} className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Style<ResizeHandle colKey="style" /></th>
                                    <th style={{ width: widths.description, minWidth: 100, position: "relative" }} className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Description<ResizeHandle colKey="description" /></th>
                                    <th style={{ width: widths.qty, minWidth: 60, position: "relative" }} className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Qty<ResizeHandle colKey="qty" /></th>
                                    <th style={{ width: widths.rate, minWidth: 80, position: "relative" }} className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Rate<ResizeHandle colKey="rate" /></th>
                                    <th style={{ width: widths.amount, minWidth: 90, position: "relative" }} className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Amount<ResizeHandle colKey="amount" /></th>
                                    <th style={{ width: 32 }} className="px-3 py-2 text-center text-xs font-medium text-slate-500 uppercase">×</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {lines.map((line, i) => (
                                    <tr key={i}>
                                        <td className="px-3 py-2" style={{ width: widths.style }}>
                                            <select required className="w-full h-8 px-2 border border-slate-300 rounded text-sm" value={line.style_id} onChange={(e) => handleStyleSelect(i, e.target.value)}>
                                                <option value="">Select Style</option>
                                                {styles.map(s => <option key={s.id} value={s.id}>{s.style_code} — {s.style_name}</option>)}
                                                <option value="ADD_NEW_STYLE" className="text-blue-600 font-medium">+ Add New Style</option>
                                            </select>
                                        </td>
                                        <td className="px-3 py-2" style={{ width: widths.description }}><input type="text" className="w-full h-8 px-2 border border-slate-300 rounded text-sm" value={line.description} onChange={(e) => handleLineChange(i, "description", e.target.value)} /></td>
                                        <td className="px-3 py-2" style={{ width: widths.qty }}><input type="number" required min="1" className="w-full h-8 px-2 border border-slate-300 rounded text-sm text-right" value={line.quantity || ""} onChange={(e) => handleLineChange(i, "quantity", e.target.value)} /></td>
                                        <td className="px-3 py-2" style={{ width: widths.rate }}><input type="number" required min="0" step="0.01" className="w-full h-8 px-2 border border-slate-300 rounded text-sm text-right" value={line.rate || ""} onChange={(e) => handleLineChange(i, "rate", e.target.value)} /></td>
                                        <td className="px-3 py-2 text-right text-sm font-medium tabular-nums" style={{ width: widths.amount }}>₹{line.amount.toFixed(2)}</td>
                                        <td className="px-3 py-2 text-center" style={{ width: 32 }}>
                                            <button type="button" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} disabled={lines.length === 1} className="text-red-400 hover:text-red-600 disabled:opacity-30">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50">
                                <tr>
                                    <td colSpan={4} className="px-3 py-3 text-right text-sm font-semibold text-slate-700">Total:</td>
                                    <td className="px-3 py-3 text-right text-sm font-bold text-slate-900 tabular-nums">₹{totalAmount.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
                    <button type="submit" disabled={loading} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? "Creating..." : "Create Order"}</button>
                </div>
            </form>

            <AddBuyerModal isOpen={showBuyerModal} onClose={() => setShowBuyerModal(false)} onSuccess={(buyer) => {
                setBuyers((prev) => [...prev, { id: buyer.id, name: buyer.name, brand_code: buyer.brand_code || "" }]);
                setFormData((prev) => ({ ...prev, buyer_id: buyer.id }));
                setShowBuyerModal(false);
            }} />

            <AddStyleModal isOpen={showStyleModal} onClose={() => setShowStyleModal(false)} onSuccess={(style) => {
                setStyles((prev) => [...prev, { id: style.id, style_code: style.style_code, style_name: style.style_name }]);
                const newLines = [...lines];
                newLines[styleModalLineIndex] = { ...newLines[styleModalLineIndex], style_id: style.id };
                setLines(newLines);
                setShowStyleModal(false);
            }} />
        </div>
    );
}
