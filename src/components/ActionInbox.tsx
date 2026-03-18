"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Inbox,
  Loader2,
} from "lucide-react";

interface ActionItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  action: string;
  href: string;
  priority: "high" | "medium" | "low";
  pending_since: string;
  days_pending: number;
}

const PRIORITY_STYLES = {
  high: "bg-red-500/10 text-red-300",
  medium: "bg-amber-500/10 text-amber-300",
  low: "bg-slate-500/10 text-slate-400",
};

const PRIORITY_DOT = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-slate-500",
};

export default function ActionInbox() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/action-inbox")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-surface-1 rounded-xl border border-border-secondary p-6">
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="w-4 h-4 text-foreground-tertiary" />
          <h2 className="text-sm font-semibold text-foreground">Action Inbox</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-foreground-tertiary animate-spin" />
        </div>
      </div>
    );
  }

  const highCount = items.filter((i) => i.priority === "high").length;

  return (
    <div className="bg-surface-1 rounded-xl border border-border-secondary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-secondary">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-foreground-tertiary" />
          <h2 className="text-sm font-semibold text-foreground">Action Inbox</h2>
          <span className="text-xs text-foreground-muted tabular-nums">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>
        {highCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
            {highCount} urgent
          </span>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <Inbox className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
          <p className="text-sm text-foreground-tertiary">All caught up — no pending actions</p>
        </div>
      ) : (
        <div className="divide-y divide-border-secondary">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-3 transition-colors group"
            >
              {/* Priority dot */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[item.priority]}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.title}
                </p>
                <p className="text-xs text-foreground-tertiary truncate mt-0.5">
                  {item.subtitle}
                </p>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 shrink-0">
                {item.days_pending > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-foreground-muted">
                    <Clock className="w-3 h-3" />
                    {item.days_pending}d
                  </span>
                )}
                <span
                  className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[item.priority]}`}
                >
                  {item.action}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground-tertiary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
