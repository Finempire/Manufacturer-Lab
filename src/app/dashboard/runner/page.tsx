"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, ShoppingCart, CheckCircle, ChevronRight, Clock, MapPin, AlertTriangle, Bell, Package } from "lucide-react";
import { format } from "date-fns";
import ActionInbox from "@/components/ActionInbox";

interface CurrentTask {
    id: string;
    request_no: string;
    store_location: string | null;
    expected_date: string | null;
    remarks: string | null;
    overdue_flag: boolean;
    buyer: { name: string };
    manager: { name: string };
    preferred_vendor: { name: string } | null;
    order: { order_no: string } | null;
    style: { style_code: string; style_name: string } | null;
    lines: { material: { description: string }; quantity: number; expected_amount: number }[];
}

interface DashboardData {
    pendingPurchases: number;
    myPurchases: number;
    pendingConfirmations: number;
    currentTask: CurrentTask | null;
}

export default function RunnerDashboard() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    useEffect(() => { fetch("/api/dashboard/runner").then((r) => r.json()).then(setData).catch(() => { }); }, []);

    const cards = [
        { label: "Pending Purchases", value: data?.pendingPurchases ?? "—", icon: <Truck className="w-5 h-5" />, color: "text-amber-400 bg-amber-500/10" },
        { label: "My Purchases", value: data?.myPurchases ?? "—", icon: <ShoppingCart className="w-5 h-5" />, color: "text-blue-400 bg-blue-500/10" },
        { label: "Pending Confirmations", value: data?.pendingConfirmations ?? "—", icon: <CheckCircle className="w-5 h-5" />, color: "text-green-400 bg-green-500/10" },
    ];

    const currentTask = data?.currentTask;

    return (
        <div className="space-y-6 pb-24 md:pb-6">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Runner Dashboard</h1>
                <p className="text-sm text-foreground-tertiary mt-1">Purchase assignments and vendor confirmations</p>
            </div>

            {/* Current Task Card - prominent at top */}
            {currentTask && (
                <div
                    className={`rounded-xl border-2 p-4 md:p-5 cursor-pointer active:scale-[0.98] transition-transform ${currentTask.overdue_flag ? "border-red-500/30 bg-red-500/10" : "border-blue-500/30 bg-blue-500/10"}`}
                    onClick={() => router.push("/dashboard/runner/pending")}
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center ${currentTask.overdue_flag ? "bg-red-500/15 text-red-400" : "bg-blue-500/15 text-blue-400"}`}>
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-tertiary">Current Task</p>
                                <h2 className="text-lg font-bold text-foreground">{currentTask.request_no}</h2>
                            </div>
                        </div>
                        {currentTask.overdue_flag && (
                            <span className="flex items-center gap-1 px-2 py-1 text-xs font-bold bg-red-500/15 text-red-400 rounded-md">
                                <AlertTriangle className="w-3.5 h-3.5" /> Overdue
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-foreground-tertiary">Buyer</p>
                            <p className="font-medium text-foreground">{currentTask.buyer.name}</p>
                        </div>
                        {currentTask.order && (
                            <div>
                                <p className="text-xs text-foreground-tertiary">Order</p>
                                <p className="font-medium text-foreground">{currentTask.order.order_no}</p>
                            </div>
                        )}
                        {currentTask.style && (
                            <div>
                                <p className="text-xs text-foreground-tertiary">Style</p>
                                <p className="font-medium text-foreground">{currentTask.style.style_code}</p>
                            </div>
                        )}
                        {currentTask.store_location && (
                            <div className="flex items-start gap-1">
                                <MapPin className="w-3.5 h-3.5 text-foreground-muted mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-foreground-tertiary">Deliver to</p>
                                    <p className="font-medium text-foreground">{currentTask.store_location}</p>
                                </div>
                            </div>
                        )}
                        {currentTask.expected_date && (
                            <div className="flex items-start gap-1">
                                <Clock className="w-3.5 h-3.5 text-foreground-muted mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-foreground-tertiary">Due</p>
                                    <p className="font-medium text-foreground">{format(new Date(currentTask.expected_date), "dd MMM yyyy")}</p>
                                </div>
                            </div>
                        )}
                        {currentTask.preferred_vendor && (
                            <div>
                                <p className="text-xs text-foreground-tertiary">Preferred Vendor</p>
                                <p className="font-medium text-foreground">{currentTask.preferred_vendor.name}</p>
                            </div>
                        )}
                    </div>

                    {currentTask.lines.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border-secondary/60">
                            <p className="text-xs text-foreground-tertiary mb-1">{currentTask.lines.length} item{currentTask.lines.length > 1 ? "s" : ""} to purchase</p>
                            <div className="space-y-1">
                                {currentTask.lines.slice(0, 3).map((line, i) => (
                                    <p key={i} className="text-sm text-foreground-secondary truncate">
                                        {line.material.description} — Qty: {line.quantity}
                                    </p>
                                ))}
                                {currentTask.lines.length > 3 && (
                                    <p className="text-xs text-foreground-muted">+{currentTask.lines.length - 3} more</p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex items-center justify-center gap-2 py-3 bg-brand text-white rounded-lg text-sm font-semibold min-h-[44px]">
                        Upload Invoice <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            )}

            {!currentTask && data && (
                <div className="rounded-xl border-2 border-dashed border-border-secondary bg-surface-3 p-6 text-center">
                    <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground-secondary">No pending tasks</p>
                    <p className="text-xs text-foreground-muted mt-1">All purchases are up to date</p>
                </div>
            )}

            {/* Summary stat cards */}
            <div className="grid grid-cols-3 gap-3">
                {cards.map((card) => (
                    <div key={card.label} className="bg-surface-1 rounded-lg border border-border-secondary p-3 md:p-4 hover:shadow-premium-md transition-shadow min-h-[44px]">
                        <div className={`inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg ${card.color} mb-2`}>{card.icon}</div>
                        <p className="text-[10px] md:text-[11px] font-medium text-foreground-tertiary uppercase tracking-wider leading-tight">{card.label}</p>
                        <p className="text-xl md:text-2xl font-bold text-foreground mt-1 tabular-nums">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Large action buttons for mobile */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => router.push("/dashboard/runner/pending")}
                    className="flex flex-col items-center justify-center gap-2 p-5 bg-amber-500/10 border-2 border-amber-500/20 rounded-xl text-amber-300 font-semibold text-sm hover:bg-amber-500/15 active:scale-[0.97] transition-all min-h-[88px]"
                >
                    <Truck className="w-7 h-7" />
                    <span>Go to Pending</span>
                    {typeof data?.pendingPurchases === "number" && data.pendingPurchases > 0 && (
                        <span className="px-2 py-0.5 bg-amber-600 text-white text-xs font-bold rounded-full">{data.pendingPurchases}</span>
                    )}
                </button>
                <button
                    onClick={() => router.push("/dashboard/runner/my-purchases")}
                    className="flex flex-col items-center justify-center gap-2 p-5 bg-blue-500/10 border-2 border-blue-500/20 rounded-xl text-blue-300 font-semibold text-sm hover:bg-blue-500/15 active:scale-[0.97] transition-all min-h-[88px]"
                >
                    <ShoppingCart className="w-7 h-7" />
                    <span>My Purchases</span>
                    {typeof data?.myPurchases === "number" && data.myPurchases > 0 && (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">{data.myPurchases}</span>
                    )}
                </button>
            </div>

            <ActionInbox />

            {/* Sticky bottom action bar - mobile only */}
            <div className="fixed bottom-0 left-0 right-0 bg-surface-1 border-t border-border-secondary shadow-[0_-2px_10px_rgba(0,0,0,0.08)] z-30 md:hidden">
                <div className="flex items-center justify-around px-2 py-1">
                    <button
                        onClick={() => router.push("/dashboard/runner/pending")}
                        className="flex flex-col items-center justify-center py-2 px-3 min-w-[72px] min-h-[56px] rounded-lg text-amber-400 active:bg-amber-500/10 transition-colors relative"
                    >
                        <Truck className="w-6 h-6" />
                        <span className="text-[10px] font-medium mt-0.5">Pending</span>
                        {typeof data?.pendingPurchases === "number" && data.pendingPurchases > 0 && (
                            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                                {data.pendingPurchases}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => router.push("/dashboard/runner/my-purchases")}
                        className="flex flex-col items-center justify-center py-2 px-3 min-w-[72px] min-h-[56px] rounded-lg text-blue-400 active:bg-blue-500/10 transition-colors"
                    >
                        <ShoppingCart className="w-6 h-6" />
                        <span className="text-[10px] font-medium mt-0.5">Purchases</span>
                    </button>
                    <button
                        onClick={() => router.push("/dashboard/runner/notifications")}
                        className="flex flex-col items-center justify-center py-2 px-3 min-w-[72px] min-h-[56px] rounded-lg text-foreground-secondary active:bg-surface-3 transition-colors"
                    >
                        <Bell className="w-6 h-6" />
                        <span className="text-[10px] font-medium mt-0.5">Notifications</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
