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
  complete: <CheckCircle2 className="w-5 h-5 text-green-600" />,
  incomplete: <XCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  na: <Minus className="w-5 h-5 text-slate-400" />,
};

const STATUS_BG = {
  complete: "bg-green-50 border-green-200",
  incomplete: "bg-red-50 border-red-200",
  warning: "bg-amber-50 border-amber-200",
  na: "bg-slate-50 border-slate-200",
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
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">
          Checking production readiness...
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-6 text-sm text-slate-400">
        Unable to load readiness data
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div
        className={`flex items-center gap-3 p-4 rounded-lg border ${
          data.isReady
            ? "bg-green-50 border-green-200"
            : data.hasWarnings
            ? "bg-amber-50 border-amber-200"
            : "bg-red-50 border-red-200"
        }`}
      >
        <Factory
          className={`w-6 h-6 ${
            data.isReady
              ? "text-green-600"
              : data.hasWarnings
              ? "text-amber-600"
              : "text-red-600"
          }`}
        />
        <div className="flex-1">
          <p
            className={`text-sm font-semibold ${
              data.isReady
                ? "text-green-900"
                : data.hasWarnings
                ? "text-amber-900"
                : "text-red-900"
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
                ? "text-green-700"
                : data.hasWarnings
                ? "text-amber-700"
                : "text-red-700"
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
            className={`rounded-lg border ${STATUS_BG[item.status]}`}
          >
            <button
              onClick={() => item.blockers.length > 0 && toggleExpand(item.id)}
              className="flex items-center gap-3 w-full p-3 text-left"
            >
              {STATUS_ICON[item.status]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
              </div>
              {item.blockers.length > 0 && (
                <span className="text-slate-400">
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
                    className="flex items-center gap-2 text-xs text-slate-600 py-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
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
          className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
        >
          <Factory className="w-4 h-4" />
          Accept for Production
        </button>
      )}

      {showActions && !data.isReady && (
        <p className="text-xs text-center text-red-600 font-medium">
          Resolve all incomplete items before accepting production
        </p>
      )}
    </div>
  );
}
