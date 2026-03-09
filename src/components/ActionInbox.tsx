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
  high: "bg-red-50 text-red-700 ring-red-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  low: "bg-slate-50 text-slate-600 ring-slate-200",
};

const PRIORITY_DOT = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-slate-400",
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
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Action Inbox</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  const highCount = items.filter((i) => i.priority === "high").length;

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Action Inbox</h2>
          <span className="text-xs text-slate-400 tabular-nums">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>
        {highCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
            <AlertCircle className="w-3.5 h-3.5" />
            {highCount} urgent
          </span>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">All caught up — no pending actions</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
            >
              {/* Priority dot */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[item.priority]}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {item.title}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {item.subtitle}
                </p>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-2 shrink-0">
                {item.days_pending > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    {item.days_pending}d
                  </span>
                )}
                <span
                  className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ${PRIORITY_STYLES[item.priority]}`}
                >
                  {item.action}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
