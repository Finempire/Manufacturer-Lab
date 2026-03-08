"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";

interface Notification {
    id: string;
    title: string;
    message: string;
    entity_type: string;
    entity_id: string;
    is_read: boolean;
    created_at: string;
}

export default function RunnerNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/notifications")
            .then(r => r.json())
            .then(data => { setNotifications(Array.isArray(data) ? data : data.notifications || []); setLoading(false); })
            .catch(() => { toast.error("Failed to load"); setLoading(false); });
    }, []);

    const markRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_read: true }),
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch { toast.error("Failed to update"); }
    };

    const markAllRead = async () => {
        try {
            await fetch("/api/notifications/mark-all-read", { method: "POST" });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            toast.success("All marked as read");
        } catch { toast.error("Failed"); }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900">Notifications</h1>
                    <p className="text-sm text-slate-500 mt-1">{unreadCount} unread</p>
                </div>
                {unreadCount > 0 && (
                    <button onClick={markAllRead} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100">
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                )}
            </div>

            <div className="space-y-2">
                {loading ? (
                    <div className="text-center py-12 text-slate-400">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
                        <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No notifications</p>
                    </div>
                ) : notifications.map(n => (
                    <div key={n.id} className={`bg-white rounded-lg border p-4 transition ${n.is_read ? "border-slate-200" : "border-blue-200 bg-blue-50/30"}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                                </div>
                                <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                                <p className="text-xs text-slate-400 mt-2">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                            </div>
                            {!n.is_read && (
                                <button onClick={() => markRead(n.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Mark as read">
                                    <Check className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
