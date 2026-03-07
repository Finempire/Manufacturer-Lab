"use client";

import React from "react";

type BadgeSize = "sm" | "md";

interface StatusConfig {
  label: string;
  classes: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  ORDER_RECEIVED: {
    label: "Order Received",
    classes: "bg-gray-100 text-gray-700",
  },
  PENDING_PM_ACCEPTANCE: {
    label: "Awaiting PM",
    classes: "bg-amber-100 text-amber-700",
  },
  MERCHANDISER_ASSIGNED: {
    label: "Merch Assigned",
    classes: "bg-blue-50 text-blue-700",
  },
  TECH_PACK_IN_PROGRESS: {
    label: "Tech Pack WIP",
    classes: "bg-blue-100 text-blue-700",
  },
  TECH_PACK_COMPLETED: {
    label: "Tech Pack Done",
    classes: "bg-cyan-100 text-cyan-700",
  },
  MATERIAL_REQUIREMENT_SENT: {
    label: "Need Req. Sent",
    classes: "bg-purple-100 text-purple-700",
  },
  MATERIAL_IN_PROGRESS: {
    label: "Material WIP",
    classes: "bg-indigo-100 text-indigo-700",
  },
  MATERIAL_COMPLETED: {
    label: "Material Done",
    classes: "bg-teal-100 text-teal-700",
  },
  PRODUCTION_ACCEPTED: {
    label: "Prod. Accepted",
    classes: "bg-green-50 text-green-700",
  },
  UNDER_PRODUCTION: {
    label: "Under Prod.",
    classes: "bg-green-100 text-green-700",
  },
  PRODUCTION_COMPLETED: {
    label: "Prod. Done",
    classes: "bg-emerald-100 text-emerald-700",
  },
  COMPLETED: {
    label: "Completed",
    classes: "bg-green-200 text-green-800",
  },
  CANCELLED: {
    label: "Cancelled",
    classes: "bg-red-100 text-red-700",
  },
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
}

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? {
    label: status.replace(/_/g, " "),
    classes: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full whitespace-nowrap ${config.classes} ${SIZE_CLASSES[size]}`}
    >
      {config.label}
    </span>
  );
}
