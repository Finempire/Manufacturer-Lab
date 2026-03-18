"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Minus,
  Loader2,
  ChevronDown,
  ChevronRight,
  Factory,
} from "lucide-react";

interface Blocker {
  id: string;
  label: string;
  status: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  status: "complete" | "incomplete" | "warning" | "na";
  detail: string;
  blockers: Blocker[];
}

interface ReadinessData {
  orderId: string;
  orderNo: string;
  currentStatus: string;
  isReady: boolean;
  hasWarnings: boolean;
  checklist: ChecklistItem[];
}

interface Props {
  orderId: string;
  onReadyConfirm?: () => void;
  showActions?: boolean;
}

const STATUS_ICON = {
  complete: <CheckCircle2 className="w-5 h-5 text-green-400" />,
  incomplete: <XCircle className="w-5 h-5 text-red-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  na: <Minus className="w-5 h-5 text-foreground-muted" />,
};

const STATUS_BG = {
  complete: "bg-green-500/10 border-green-500/20",
  incomplete: "bg-red-500/10 border-red-500/20",
  warning: "bg-amber-500/10 border-amber-500/20",
  na: "bg-surface-3 border-border-secondary",
};

export default function ProductionReadinessChecklist({
  orderId,
  onReadyConfirm,
  showActions = true,
}: Props) {
  const [data, setData] = useState<ReadinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orders/${orderId}/production-readiness`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-foreground-muted" />
        <span className="ml-2 text-sm text-foreground-tertiary">
          Checking production readiness...
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-6 text-sm text-foreground-muted">
        Unable to load readiness data
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className={`flex items-center gap-3 p-4 rounded-xl border ${
          data.isReady
            ? "bg-green-500/10 border-green-500/20"
            : data.hasWarnings
            ? "bg-amber-500/10 border-amber-500/20"
            : "bg-red-500/10 border-red-500/20"
        }`}
      >
        <Factory
          className={`w-6 h-6 ${
            data.isReady
              ? "text-green-400"
              : data.hasWarnings
              ? "text-amber-400"
              : "text-red-400"
          }`}
        />
        <div className="flex-1">
          <p
            className={`text-sm font-semibold ${
              data.isReady
                ? "text-green-300"
                : data.hasWarnings
                ? "text-amber-300"
                : "text-red-300"
            }`}
          >
            {data.isReady
              ? "Production Ready"
              : data.hasWarnings
              ? "Ready with Warnings"
              : "Not Ready for Production"}
          </p>
          <p
            className={`text-xs mt-0.5 ${
              data.isReady
                ? "text-green-400"
                : data.hasWarnings
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {data.isReady
              ? "All prerequisites are met. Production can start."
              : data.hasWarnings
              ? "Some items need attention but production can proceed."
              : "Outstanding items must be resolved before production."}
          </p>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {data.checklist.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border ${STATUS_BG[item.status]}`}
          >
            <button
              onClick={() => item.blockers.length > 0 && toggleExpand(item.id)}
              className="flex items-center gap-3 w-full p-3 text-left"
            >
              {STATUS_ICON[item.status]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {item.label}
                </p>
                <p className="text-xs text-foreground-tertiary mt-0.5">{item.detail}</p>
              </div>
              {item.blockers.length > 0 && (
                <span className="text-foreground-muted">
                  {expanded[item.id] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
              )}
            </button>

            {/* Expanded blockers */}
            {expanded[item.id] && item.blockers.length > 0 && (
              <div className="px-3 pb-3 pt-0 ml-8 space-y-1">
                {item.blockers.map((blocker) => (
                  <div
                    key={blocker.id}
                    className="flex items-center gap-2 text-xs text-foreground-secondary py-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground-muted shrink-0" />
                    {blocker.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Button */}
      {showActions && data.isReady && onReadyConfirm && (
        <button
          onClick={onReadyConfirm}
          className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition"
        >
          <Factory className="w-4 h-4" />
          Accept for Production
        </button>
      )}

      {showActions && !data.isReady && (
        <p className="text-xs text-center text-red-400 font-medium">
          Resolve all incomplete items before accepting production
        </p>
      )}
    </div>
  );
}
