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
    classes: "bg-gray-50 text-gray-700 ring-gray-200",
  },
  PENDING_PM_ACCEPTANCE: {
    label: "Awaiting PM",
    classes: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  MERCHANDISER_ASSIGNED: {
    label: "Merch Assigned",
    classes: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  TECH_PACK_IN_PROGRESS: {
    label: "Tech Pack WIP",
    classes: "bg-blue-100 text-blue-800 ring-blue-300",
  },
  TECH_PACK_COMPLETED: {
    label: "Tech Pack Done",
    classes: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  },
  MATERIAL_REQUIREMENT_SENT: {
    label: "Need Req. Sent",
    classes: "bg-purple-50 text-purple-700 ring-purple-200",
  },
  MATERIAL_IN_PROGRESS: {
    label: "Material WIP",
    classes: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  },
  MATERIAL_COMPLETED: {
    label: "Material Done",
    classes: "bg-teal-50 text-teal-700 ring-teal-200",
  },
  PRODUCTION_ACCEPTED: {
    label: "Prod. Accepted",
    classes: "bg-green-50 text-green-700 ring-green-200",
  },
  UNDER_PRODUCTION: {
    label: "Under Prod.",
    classes: "bg-green-100 text-green-800 ring-green-300",
  },
  PRODUCTION_COMPLETED: {
    label: "Prod. Done",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  COMPLETED: {
    label: "Completed",
    classes: "bg-green-200 text-green-900 ring-green-300",
  },
  CANCELLED: {
    label: "Cancelled",
    classes: "bg-red-50 text-red-700 ring-red-200",
  },
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "px-2.5 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
}

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? {
    label: status.replace(/_/g, " "),
    classes: "bg-gray-50 text-gray-600 ring-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ring-1 whitespace-nowrap ${config.classes} ${SIZE_CLASSES[size]}`}
    >
      {config.label}
    </span>
  );
}
