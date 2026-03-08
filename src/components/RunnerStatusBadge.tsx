"use client";

import React from "react";

interface RunnerStatusConfig {
  label: string;
  classes: string;
}

const RUNNER_STATUS_MAP: Record<string, RunnerStatusConfig> = {
  AVAILABLE: {
    label: "Available",
    classes: "bg-green-50 text-green-700 border border-green-200",
  },
  ON_TASK: {
    label: "On Task",
    classes: "bg-amber-50 text-amber-700 border border-amber-200",
  },
};

interface RunnerStatusBadgeProps {
  status: string;
}

export default function RunnerStatusBadge({ status }: RunnerStatusBadgeProps) {
  const config = RUNNER_STATUS_MAP[status] ?? {
    label: status.replace(/_/g, " "),
    classes: "bg-slate-50 text-slate-600 border border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
