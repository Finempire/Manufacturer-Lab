"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Eye, Pencil, X, Trash2, Filter, Download } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useColumnResize } from "@/hooks/useColumnResize";
import AddBuyerModal from "@/components/AddBuyerModal";
import AddStyleModal from "@/components/AddStyleModal";
import StatusBadge from "@/components/StatusBadge";
import { SavedFilters } from "@/components/SavedFilters";
import { DatePresets } from "@/components/DatePresets";
import { exportToExcel } from "@/lib/exportExcel";

const ORDER_STATUSES = [
    "ORDER_RECEIVED", "PENDING_PM_ACCEPTANCE", "MERCHANDISER_ASSIGNED", "TECH_PACK_IN_PROGRESS",
    "TECH_PACK_COMPLETED", "MATERIAL_REQUIREMENT_SENT", "MATERIAL_IN_PROGRESS", "MATERIAL_COMPLETED",
    "PRODUCTION_ACCEPTED", "UNDER_PRODUCTION", "PRODUCTION_COMPLETED", "COMPLETED", "CANCELLED"
];

interface Order {
    id: string;
    order_no: string;
    order_date: string;
    buyer: { name: string; brand_code: string };
    order_type: string;
    total_amount: number;
    status: string;
    merchandiser?: { name: string } | null;
    blocker_code?: string | null;
    pending_since_at?: string | null;
    overdue_flag?: boolean;
}

interface Buyer { id: string; name: string; brand_code: string; }
interface StyleItem { id: string; style_code: string; style_name: string; category?: string | null; }
interface Line { style_id: string; description: string; quantity: number; rate: number; amount: number; }

const INITIAL_COL_WIDTHS = { style: 160, description: 160, qty: 80, rate: 100, amount: 110 };

export default function OrdersList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Filter state
    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [datePreset, setDatePreset] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [currentFilters, setCurrentFilters] = useState<Record<string, unknown>>({});

    // New Order form state
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [styles, setStyles] = useState<StyleItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [showBuyerModal, setShowBuyerModal] = useState(false);
    const [showStyleModal, setShowStyleModal] = useState(false);
    const [styleModalLineIndex, setStyleModalLineIndex] = useState<number>(0);
    const [orderNo, setOrderNo] = useState("");
    const [formData, setFormData] = useState({
        buyer_id: "", order_date: new Date().toISOString().split("T")[0], shipping_date: "", order_type: "PRODUCTION", remarks: "",
    });
    const [lines, setLines] = useState<Line[]>([{ style_id: "", description: "", quantity: 0, rate: 0, amount: 0 }]);
    const { widths, startResize } = useColumnResize(INITIAL_COL_WIDTHS);

    const fetchOrders = useCallback(() => {
        fetch("/api/orders")
            .then((r) => r.json())
            .then((data) => { setOrders(data); setLoading(false); })
            .catch(() => { toast.error("Failed to load orders"); setLoading(false); });
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const openDrawer = () => {
        setDrawerOpen(true);
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
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setFormData({ buyer_id: "", order_date: new Date().toISOString().split("T")[0], shipping_date: "", order_type: "PRODUCTION", remarks: "" });
        setLines([{ style_id: "", description: "", quantity: 0, rate: 0, amount: 0 }]);
        setOrderNo("");
    };

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
        setSubmitting(true);
        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, order_no: orderNo, lines }),
            });
            if (!res.ok) throw new Error("Failed to create order");
            toast.success("Order created successfully");
            closeDrawer();
            fetchOrders();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to create order");
        } finally {
            setSubmitting(false);
        }
    };

    const handleBuyerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === "ADD_NEW") {
            setShowBuyerModal(true);
        } else {
            setFormData({ ...formData, buyer_id: e.target.value });
        }
    };

    // Filter logic
    const filteredOrders = orders.filter((order) => {
        if (statusFilter && order.status !== statusFilter) return false;
        if (typeFilter && order.order_type !== typeFilter) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!order.order_no.toLowerCase().includes(q) &&
                !order.buyer?.name?.toLowerCase().includes(q) &&
                !order.merchandiser?.name?.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    const handleApplyFilter = useCallback((filters: Record<string, unknown>) => {
        setStatusFilter((filters.status as string) || "");
        setTypeFilter((filters.type as string) || "");
        setSearchQuery((filters.search as string) || "");
        setCurrentFilters(filters);
    }, []);

    const handleDatePreset = (from: string, to: string) => {
        setDatePreset(from);
        // In a real app, would pass to API for server-side filtering
    };

    const handleExport = () => {
        const exportData = filteredOrders.map(o => ({
            "Order No": o.order_no,
            "Date": format(new Date(o.order_date), "dd MMM yyyy"),
            "Buyer": o.buyer?.name,
            "Type": o.order_type,
            "Amount": o.total_amount,
            "Status": o.status.replace(/_/g, " "),
        }));
        exportToExcel(exportData, "Orders_Export");
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
            <div style={{ width: "2px", height: "100%", borderRadius: "1px" }} className="bg-slate-300 hover:bg-blue-500 active:bg-blue-500 transition-colors" />
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900">Orders</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{filteredOrders.length} of {orders.length} orders</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExport} disabled={filteredOrders.length === 0} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button onClick={openDrawer} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors">
                        <Plus className="w-4 h-4" /> New Order
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        type="text"
                        placeholder="Search orders, buyers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 px-3 text-sm border border-slate-200 rounded-md w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-8 px-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">All Statuses</option>
                        {ORDER_STATUSES.map(s => (
                            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                        ))}
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-8 px-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">All Types</option>
                        <option value="PRODUCTION">Production</option>
                        <option value="SAMPLE">Sample</option>
                    </select>
                    <DatePresets onSelect={handleDatePreset} activePreset={datePreset} />
                    {(statusFilter || typeFilter || searchQuery) && (
                        <button
                            onClick={() => { setStatusFilter(""); setTypeFilter(""); setSearchQuery(""); }}
                            className="text-xs text-slate-500 hover:text-slate-700 underline"
                        >
                            Clear all
                        </button>
                    )}
                </div>
                <SavedFilters
                    page="orders"
                    currentFilters={{ status: statusFilter, type: typeFilter, search: searchQuery }}
                    onApplyFilter={handleApplyFilter}
                />
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Order No</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Buyer</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="px-3 py-12 text-center text-sm text-slate-400">Loading...</td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan={7} className="px-3 py-12 text-center text-sm text-slate-400">{orders.length > 0 ? "No orders match your filters" : "No orders found. Create one to get started."}</td></tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className={`hover:bg-slate-50 transition-colors h-10 ${order.overdue_flag ? "bg-red-50/50" : ""}`}>
                                        <td className="px-3 py-2.5">
                                            <span className="text-sm font-medium font-mono text-slate-900">{order.order_no}</span>
                                            {order.overdue_flag && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-red-500" title="Overdue" />}
                                        </td>
                                        <td className="px-3 py-2.5 text-sm text-slate-500">{format(new Date(order.order_date), "dd MMM yyyy")}</td>
                                        <td className="px-3 py-2.5 text-sm text-slate-700">{order.buyer?.name}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${order.order_type === "SAMPLE" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"}`}>
                                                {order.order_type}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-sm text-slate-900 text-right font-medium tabular-nums font-mono">
                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(order.total_amount)}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Link href={`/dashboard/accountant/orders/${order.id}`} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded" title="View">
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link href={`/dashboard/accountant/orders/${order.id}/edit`} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded" title="Edit">
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Backdrop overlay */}
            {drawerOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={closeDrawer} />
            )}

            {/* Side Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                        <h2 className="text-base font-semibold text-slate-800">Create New Order</h2>
                        <button onClick={closeDrawer} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <form id="new-order-form" onSubmit={handleSubmit} className="space-y-5">
                            {/* Row 1: Order Type | Buyer + Add New */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Order Type <span className="text-red-500">*</span></label>
                                    <select required className="w-full h-9 px-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={formData.order_type} onChange={(e) => setFormData({ ...formData, order_type: e.target.value })}>
                                        <option value="PRODUCTION">Production</option>
                                        <option value="SAMPLE">Sample</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Buyer <span className="text-red-500">*</span></label>
                                    <select required className="w-full h-9 px-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={formData.buyer_id} onChange={handleBuyerChange}>
                                        <option value="">Select Buyer</option>
                                        {buyers.map((b) => (<option key={b.id} value={b.id}>{b.name} ({b.brand_code})</option>))}
                                        <option value="ADD_NEW" className="text-blue-600 font-medium">+ Add New Buyer</option>
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Order No | Order Date | Shipping Date */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Order No</label>
                                    <input type="text" placeholder="Auto-generated" className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-md text-sm" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Order Date <span className="text-red-500">*</span></label>
                                    <input type="date" required className="w-full h-9 px-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={formData.order_date} onChange={(e) => setFormData({ ...formData, order_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Shipping Date <span className="text-red-500">*</span></label>
                                    <input type="date" required className="w-full h-9 px-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" value={formData.shipping_date} onChange={(e) => setFormData({ ...formData, shipping_date: e.target.value })} />
                                </div>
                            </div>

                            {/* Row 3: Remarks */}
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Remarks</label>
                                <textarea className="w-full p-3 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" rows={2} value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
                            </div>

                            {/* Item Lines with resizable columns */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-slate-800">Item Lines</h3>
                                    <button type="button" onClick={() => setLines([...lines, { style_id: "", description: "", quantity: 0, rate: 0, amount: 0 }])} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-slate-100 rounded-md">
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
                                                <th style={{ width: 32 }} className="px-3 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {lines.map((line, i) => (
                                                <tr key={i}>
                                                    <td className="px-3 py-2" style={{ width: widths.style }}>
                                                        <select required className="w-full h-8 px-2 border border-slate-200 rounded-md text-sm" value={line.style_id} onChange={(e) => handleStyleSelect(i, e.target.value)}>
                                                            <option value="">Select Style</option>
                                                            {styles.map(s => <option key={s.id} value={s.id}>{s.style_code} — {s.style_name}</option>)}
                                                            <option value="ADD_NEW_STYLE" className="text-blue-600 font-medium">+ Add New Style</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2" style={{ width: widths.description }}><input type="text" className="w-full h-8 px-2 border border-slate-200 rounded-md text-sm" value={line.description} onChange={(e) => handleLineChange(i, "description", e.target.value)} /></td>
                                                    <td className="px-3 py-2" style={{ width: widths.qty }}><input type="number" required min="1" className="w-full h-8 px-2 border border-slate-200 rounded-md text-sm text-right" value={line.quantity || ""} onChange={(e) => handleLineChange(i, "quantity", e.target.value)} /></td>
                                                    <td className="px-3 py-2" style={{ width: widths.rate }}><input type="number" required min="0" step="0.01" className="w-full h-8 px-2 border border-slate-200 rounded-md text-sm text-right" value={line.rate || ""} onChange={(e) => handleLineChange(i, "rate", e.target.value)} /></td>
                                                    <td className="px-3 py-2 text-right text-sm font-medium tabular-nums font-mono" style={{ width: widths.amount }}>₹{line.amount.toFixed(2)}</td>
                                                    <td className="px-3 py-2 text-center" style={{ width: 32 }}>
                                                        <button type="button" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} disabled={lines.length === 1} className="text-slate-400 hover:text-red-600 disabled:opacity-30">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50">
                                            <tr>
                                                <td colSpan={4} className="px-3 py-3 text-right text-sm font-semibold text-slate-700">Total:</td>
                                                <td className="px-3 py-3 text-right text-sm font-bold text-slate-900 tabular-nums font-mono">₹{totalAmount.toFixed(2)}</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
                        <button type="button" onClick={closeDrawer} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50">Cancel</button>
                        <button type="submit" form="new-order-form" disabled={submitting} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">{submitting ? "Creating..." : "Create Order"}</button>
                    </div>
                </div>
            </div>

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
