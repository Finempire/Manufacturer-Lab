"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, Inbox } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  entity_type?: string;
  entity_id?: string;
}

type FilterTab = "all" | "unread" | "approvals" | "mentions" | "reminders";

const ENTITY_GROUPS: Record<string, string> = {
  ORDER: "Orders",
  TECH_PACK: "Tech Packs",
  PURCHASE: "Purchases",
  EXPENSE: "Expenses",
  MATERIAL_REQUEST: "Material Requests",
  MATERIAL_REQUIREMENT: "Material Requirements",
};

const ENTITY_LINK_PREFIX: Record<string, string> = {
  ORDER: "/orders/",
  TECH_PACK: "/tech-packs/",
  PURCHASE: "/purchases/",
  EXPENSE: "/expenses/",
  MATERIAL_REQUEST: "/material-requests/",
  MATERIAL_REQUIREMENT: "/material-requirements/",
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "approvals", label: "Approvals" },
  { key: "mentions", label: "Mentions" },
  { key: "reminders", label: "Reminders" },
];

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

function matchesFilter(n: Notification, tab: FilterTab): boolean {
  switch (tab) {
    case "all":
      return true;
    case "unread":
      return !n.is_read;
    case "approvals":
      return (
        n.title.toLowerCase().includes("approv") ||
        n.title.toLowerCase().includes("review") ||
        n.title.toLowerCase().includes("accept") ||
        n.message.toLowerCase().includes("approv")
      );
    case "mentions":
      return (
        n.title.toLowerCase().includes("mention") ||
        n.message.toLowerCase().includes("@")
      );
    case "reminders":
      return (
        n.title.toLowerCase().includes("remind") ||
        n.title.toLowerCase().includes("overdue") ||
        n.title.toLowerCase().includes("pending")
      );
  }
}

function groupByEntity(
  notifications: Notification[]
): { group: string; items: Notification[] }[] {
  const grouped: Record<string, Notification[]> = {};

  for (const n of notifications) {
    const key = n.entity_type || "OTHER";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(n);
  }

  return Object.entries(grouped).map(([key, items]) => ({
    group: ENTITY_GROUPS[key] || key,
    items,
  }));
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        fetch("/api/notifications?unread=true"),
        fetch("/api/notifications?limit=50"),
      ]);
      if (countRes.ok) {
        const data = await countRes.json();
        setUnreadCount(data.count || 0);
      }
      if (listRes.ok) {
        const data = await listRes.json();
        const items: Notification[] = Array.isArray(data)
          ? data.slice(0, 50)
          : data.notifications?.slice(0, 50) || [];
        setNotifications(items);
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      /* silent */
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch {
      /* silent */
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.is_read) {
      markAsRead(n.id);
    }
    if (n.entity_type && n.entity_id) {
      const prefix = ENTITY_LINK_PREFIX[n.entity_type];
      if (prefix) {
        window.location.href = prefix + n.entity_id;
      }
    }
    setIsOpen(false);
  };

  const filtered = notifications.filter((n) => matchesFilter(n, activeTab));
  const grouped = groupByEntity(filtered);

  return (
    <div ref={containerRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 text-foreground-tertiary hover:text-foreground-secondary rounded-lg hover:bg-surface-3 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[420px] max-h-[540px] bg-surface-2 border border-border rounded-xl shadow-premium-xl overflow-hidden z-50 flex flex-col animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border-secondary flex items-center justify-between shrink-0">
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-medium text-brand-hover hover:text-brand transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="px-3 py-2 border-b border-border-secondary flex gap-1 shrink-0 overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "bg-brand text-white"
                    : "text-foreground-tertiary hover:text-foreground-secondary hover:bg-surface-3"
                }`}
              >
                {tab.label}
                {tab.key === "unread" && unreadCount > 0 && (
                  <span className="ml-1 text-[10px]">({unreadCount})</span>
                )}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Inbox className="w-8 h-8 text-foreground-muted mb-2" />
                <p className="text-sm text-foreground-tertiary">No notifications</p>
                <p className="text-xs text-foreground-muted mt-1">
                  {activeTab !== "all"
                    ? "Try switching to a different filter"
                    : "You're all caught up"}
                </p>
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.group}>
                  <div className="px-4 py-1.5 bg-surface-3 border-b border-border-secondary">
                    <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
                      {group.group}
                    </span>
                  </div>

                  {group.items.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`group px-4 py-2.5 border-b border-border-secondary hover:bg-surface-3 cursor-pointer flex items-start gap-3 transition-colors ${
                        !n.is_read ? "bg-brand-muted" : ""
                      }`}
                    >
                      <div className="mt-1.5 shrink-0">
                        {!n.is_read ? (
                          <div className="w-2 h-2 rounded-full bg-brand" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-transparent" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm line-clamp-1 ${
                            !n.is_read
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground-secondary"
                          }`}
                        >
                          {n.title}
                        </p>
                        <p className="text-xs text-foreground-tertiary line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <p className="text-[11px] text-foreground-muted mt-1">
                          {formatRelativeTime(n.created_at)}
                        </p>
                      </div>

                      {!n.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                          className="mt-1 p-1 rounded text-foreground-muted hover:text-brand-hover hover:bg-brand-muted opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-4 py-2.5 border-t border-border-secondary bg-surface-3 shrink-0">
              <span className="text-xs text-foreground-muted">
                Showing {filtered.length} notification
                {filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
