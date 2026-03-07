"use client";

import { useState } from "react";
import { Receipt, Plus, X } from "lucide-react";
import { toast } from "sonner";
import AddBuyerModal from "@/components/AddBuyerModal";

interface Buyer { id: string; name: string; brand_code: string; }
interface Order { id: string; order_no: string; }

export default function ManagerExpensesPage() {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [showBuyerModal, setShowBuyerModal] = useState(false);

    const [formData, setFormData] = useState({
        buyer_id: "",
        order_id: "",
        expense_date: new Date().toISOString().split("T")[0],
        expense_category: "TRAVEL",
        description: "",
        expected_amount: "",
    });

    const openDrawer = () => {
        setDrawerOpen(true);
        if (buyers.length === 0) fetch("/api/master/buyers").then(r => r.json()).then(setBuyers).catch(() => toast.error("Failed to load buyers"));
        if (orders.length === 0) fetch("/api/orders").then(r => r.json()).then(setOrders).catch(() => toast.error("Failed to load orders"));
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setFormData({
            buyer_id: "",
            order_id: "",
            expense_date: new Date().toISOString().split("T")[0],
            expense_category: "TRAVEL",
            description: "",
            expected_amount: "",
        });
    };

    const handleBuyerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === "ADD_NEW") {
            setShowBuyerModal(true);
        } else {
            setFormData({ ...formData, buyer_id: e.target.value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                expected_amount: parseFloat(formData.expected_amount)
            };

            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to create expense request");
            toast.success("Expense request created successfully");
            closeDrawer();
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to create expense request");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Expense Requests</h1>
                    <p className="text-sm text-gray-500 mt-1">Raise and track your expense requests</p>
                </div>
                <button
                    onClick={openDrawer}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> New Expense
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No expense requests raised</p>
            </div>

            {/* Backdrop overlay */}
            {drawerOpen && (
                <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={closeDrawer} />
            )}

            {/* Side Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
                <div className="flex flex-col h-full">
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-900">New Expense Request</h2>
                        <button onClick={closeDrawer} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Drawer Body - Form */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <form id="new-expense-form" onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Buyer *</label>
                                <select required className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.buyer_id} onChange={handleBuyerChange}>
                                    <option value="">Select Buyer</option>
                                    {buyers.map((b) => (<option key={b.id} value={b.id}>{b.name} ({b.brand_code})</option>))}
                                    <option value="ADD_NEW" className="text-blue-600 font-medium">+ Add New Buyer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Order *</label>
                                <select required className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.order_id} onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}>
                                    <option value="">Select Order</option>
                                    {orders.map((o) => (<option key={o.id} value={o.id}>{o.order_no}</option>))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                                    <input type="date" required className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                                    <select required className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.expense_category} onChange={(e) => setFormData({ ...formData, expense_category: e.target.value })}>
                                        <option value="TRAVEL">Travel</option>
                                        <option value="FOOD">Food</option>
                                        <option value="MATERIALS">Materials</option>
                                        <option value="MISC">Miscellaneous</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Expected Amount (₹) *</label>
                                <input type="number" required min="1" step="0.01" placeholder="0.00" className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.expected_amount} onChange={(e) => setFormData({ ...formData, expected_amount: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                                <textarea required rows={3} placeholder="Describe the expense..." className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                        </form>
                    </div>

                    {/* Drawer Footer */}
                    <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <button type="button" onClick={closeDrawer} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" form="new-expense-form" disabled={submitting} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? "Submitting..." : "Submit Request"}</button>
                    </div>
                </div>
            </div>

            <AddBuyerModal
                isOpen={showBuyerModal}
                onClose={() => setShowBuyerModal(false)}
                onSuccess={(buyer) => {
                    setBuyers((prev) => [...prev, { id: buyer.id, name: buyer.name, brand_code: buyer.brand_code || "" }]);
                    setFormData((prev) => ({ ...prev, buyer_id: buyer.id }));
                    setShowBuyerModal(false);
                }}
            />
        </div>
    );
}
