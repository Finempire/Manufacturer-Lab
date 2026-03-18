"use client";

import React from "react";

interface RunnerStatusConfig {
  label: string;
  classes: string;
}

const RUNNER_STATUS_MAP: Record<string, RunnerStatusConfig> = {
  AVAILABLE: {
    label: "Available",
    classes: "bg-green-500/10 text-green-400 border border-green-500/20",
  },
  ON_TASK: {
    label: "On Task",
    classes: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  },
};

interface RunnerStatusBadgeProps {
  status: string;
}

export default function RunnerStatusBadge({ status }: RunnerStatusBadgeProps) {
  const config = RUNNER_STATUS_MAP[status] ?? {
    label: status.replace(/_/g, " "),
    classes: "bg-surface-3 text-foreground-secondary border border-border-secondary",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
