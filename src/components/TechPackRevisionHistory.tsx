"use client";

import React from "react";
import {
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";

interface TechPackRevision {
  id: string;
  revisionNumber: number;
  documentUrl?: string | null;
  status: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  pmNotes?: string | null;
  submittedBy?: string | null;
  reviewedBy?: string | null;
}

interface TechPackRevisionHistoryProps {
  revisions: TechPackRevision[];
}

function getStatusConfig(status: string): {
  label: string;
  icon: React.ElementType;
  badgeClasses: string;
} {
  switch (status) {
    case "SUBMITTED":
      return {
        label: "Submitted",
        icon: Clock,
        badgeClasses: "bg-blue-50 text-blue-700",
      };
    case "APPROVED":
      return {
        label: "Approved",
        icon: CheckCircle2,
        badgeClasses: "bg-green-50 text-green-700",
      };
    case "REVISION_REQUIRED":
      return {
        label: "Revision Required",
        icon: AlertTriangle,
        badgeClasses: "bg-orange-50 text-orange-700",
      };
    case "REJECTED":
      return {
        label: "Rejected",
        icon: XCircle,
        badgeClasses: "bg-red-50 text-red-700",
      };
    default:
      return {
        label: status.replace(/_/g, " "),
        icon: Clock,
        badgeClasses: "bg-slate-50 text-slate-600",
      };
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd MMM yyyy, hh:mm a");
  } catch {
    return String(value);
  }
}

export default function TechPackRevisionHistory({
  revisions,
}: TechPackRevisionHistoryProps) {
  const sorted = [...revisions].sort(
    (a, b) => b.revisionNumber - a.revisionNumber
  );

  const latestNeedsRevision =
    sorted.length > 0 && sorted[0].status === "REVISION_REQUIRED";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-slate-600" />
        <h3 className="text-lg font-semibold text-slate-900">
          Tech Pack Revision History
        </h3>
      </div>

      {/* Revision required banner */}
      {latestNeedsRevision && (
        <div className="rounded-md bg-orange-50 border border-orange-200 px-3 py-2 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
          <p className="text-sm text-orange-700 font-medium">
            Revision required on the latest tech pack submission. Please review
            PM notes and resubmit.
          </p>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">
          No tech pack revisions found.
        </p>
      ) : (
        <div className="space-y-3">
          {sorted.map((rev) => {
            const statusConfig = getStatusConfig(rev.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={rev.id}
                className={`rounded-md border p-3 ${
                  rev.status === "REVISION_REQUIRED"
                    ? "border-orange-200 bg-orange-50/30"
                    : "border-slate-200 bg-white"
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Revision {rev.revisionNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.badgeClasses}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>
                  {rev.documentUrl && (
                    <a
                      href={rev.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View Document
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-slate-400 block">Submitted</span>
                    <span className="text-slate-700">
                      {formatDate(rev.submittedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Submitted By</span>
                    <span className="text-slate-700">
                      {rev.submittedBy ?? "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Reviewed</span>
                    <span className="text-slate-700">
                      {formatDate(rev.reviewedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Reviewed By</span>
                    <span className="text-slate-700">
                      {rev.reviewedBy ?? "-"}
                    </span>
                  </div>
                </div>

                {/* PM Notes */}
                {rev.pmNotes && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-400 block mb-0.5">
                      PM Notes
                    </span>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {rev.pmNotes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
