"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, Filter, TrendingUp, Users, Presentation, LayoutDashboard } from "lucide-react";
import { exportToExcel } from "@/lib/exportExcel";
import { toast } from "sonner";

const TABS = [
    { id: "daily-petty-cash", label: "Daily Petty Cash" },
    { id: "vendor-wise", label: "Vendor Wise Purchases" },
    { id: "cogs", label: "Buyer & Order Cost (COGS)" },
    { id: "runner-performance", label: "Runner Boy Performance" },
    { id: "expense-report", label: "Expense Report" },
    { id: "style-wise", label: "Style-Wise Cost" }
];

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState("vendor-wise");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReportData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            let url = `/api/reports?type=${activeTab}`;
            if (dateRange.start && dateRange.end) {
                url += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to load");
            const json = await res.json();

            // Handle the specific daily-petty-cash multi-array return
            if (activeTab === "daily-petty-cash") {
                // Flatten to a single array for table view
                const flattened = [
                    ...json.payments.map((p: any) => ({
                        Date: new Date(p.payment_date).toLocaleDateString(),
                        Type: "Purchase Payment",
                        Ref: p.purchase?.purchase_no || "-",
                        Method: p.payment_method,
                        Amount_Out: p.amount_paid
                    })),
                    ...json.expenses.map((e: any) => ({
                        Date: new Date(e.payment_date).toLocaleDateString(),
                        Type: "Expense Payment",
                        Ref: e.expense_no,
                        Method: e.payment_method,
                        Amount_Out: e.actual_amount
                    }))
                ].sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
                setData(flattened);
            } else {
                setData(json);
            }
        } catch (error) {
            toast.error("Error loading report");
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        exportToExcel(data, `Report_${activeTab.replace(/-/g, '_')}`);
    };

    const renderChart = () => {
        if (!data || data.length === 0) return null;

        let dataKey = "";
        let xKey = "";

        if (activeTab === "vendor-wise") { xKey = "vendor_name"; dataKey = "amount"; }
        if (activeTab === "cogs") { xKey = "order_no"; dataKey = "total_cost"; }
        if (activeTab === "runner-performance") { xKey = "runner_name"; dataKey = "amount_handled"; }

        if (xKey && dataKey) {
            return (
                <div className="h-64 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: '#f8fafc' }} />
                            <Bar dataKey={dataKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            );
        }
        return null; // Don't show chart for daily cash or expenses (too wide)
    };

    const renderTable = () => {
        if (!data || data.length === 0) return <div className="p-8 text-center text-gray-500">No data found for this period</div>;

        const headers = Object.keys(data[0]);

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-y border-gray-200 text-xs uppercase font-bold text-gray-600">
                        <tr>
                            {headers.map(h => (
                                <th key={h} className="px-4 py-3">{h.replace(/_/g, " ")}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                {headers.map(h => (
                                    <td key={h} className="px-4 py-2 text-gray-800">
                                        {typeof row[h] === "number" && h.includes("amount") ? `₹${row[h].toLocaleString()}` : row[h]?.toString()}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><LayoutDashboard className="w-5 h-5 text-blue-600" /> Analytical Reports</h1>
                    <p className="text-sm text-gray-500 mt-1">Export, filter, and track core business metrics</p>
                </div>

                <div className="flex bg-white border border-gray-200 rounded-lg p-1.5 shadow-sm">
                    <input type="date" className="text-xs px-2 py-1 outline-none" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
                    <span className="text-gray-400 px-2">-</span>
                    <input type="date" className="text-xs px-2 py-1 outline-none" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
                    <button onClick={fetchReportData} className="ml-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold flex items-center gap-1 transition">
                        <Filter className="w-3 h-3" /> Apply
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-gray-800">{TABS.find(t => t.id === activeTab)?.label}</h2>
                        <button onClick={handleExport} disabled={data.length === 0} className="flex flex-row items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-green-700 transition disabled:opacity-50">
                            <Download className="w-4 h-4" /> Export Excel
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-24 text-center text-gray-400 animate-pulse">Running data aggregation...</div>
                    ) : (
                        <>
                            {renderChart()}
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                {renderTable()}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
