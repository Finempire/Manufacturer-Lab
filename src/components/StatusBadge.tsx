"use client";

import React from "react";

type BadgeSize = "sm" | "md";

interface StatusConfig {
  label: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  // Order statuses (simplified flow)
  ORDER_RECEIVED: {
    label: "Order Received",
    dotColor: "bg-slate-400",
    bgColor: "bg-slate-500/10",
    textColor: "text-slate-300",
  },
  REQUEST_RAISED: {
    label: "Request Raised",
    dotColor: "bg-blue-400",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-300",
  },
  INVOICE_SUBMITTED: {
    label: "Invoice Submitted",
    dotColor: "bg-indigo-400",
    bgColor: "bg-indigo-500/10",
    textColor: "text-indigo-300",
  },
  APPROVED: {
    label: "Approved",
    dotColor: "bg-green-400",
    bgColor: "bg-green-500/10",
    textColor: "text-green-300",
  },
  PAID: {
    label: "Paid",
    dotColor: "bg-emerald-400",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-300",
  },
  COMPLETED: {
    label: "Completed",
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-500/15",
    textColor: "text-emerald-300",
  },
  CANCELLED: {
    label: "Cancelled",
    dotColor: "bg-red-400",
    bgColor: "bg-red-500/10",
    textColor: "text-red-300",
  },
  // Purchase statuses
  PENDING_PURCHASE: {
    label: "Pending Purchase",
    dotColor: "bg-amber-400",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-300",
  },
  SELF_PURCHASE: {
    label: "Self Purchase",
    dotColor: "bg-blue-400",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-300",
  },
  PARTIALLY_PAID: {
    label: "Partially Paid",
    dotColor: "bg-indigo-400",
    bgColor: "bg-indigo-500/10",
    textColor: "text-indigo-300",
  },
  PAID_PENDING_TAX_INVOICE: {
    label: "Paid (Tax Invoice Pending)",
    dotColor: "bg-purple-400",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-300",
  },
  REJECTED: {
    label: "Rejected",
    dotColor: "bg-red-400",
    bgColor: "bg-red-500/10",
    textColor: "text-red-300",
  },
  // Expense statuses
  PENDING_APPROVAL: {
    label: "Pending Approval",
    dotColor: "bg-amber-400",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-300",
  },
  PENDING_PAYMENT: {
    label: "Pending Payment",
    dotColor: "bg-indigo-400",
    bgColor: "bg-indigo-500/10",
    textColor: "text-indigo-300",
  },
  // Material requirement statuses
  PENDING_STORE_ACCEPTANCE: {
    label: "Awaiting Store",
    dotColor: "bg-amber-400",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-300",
  },
  ACCEPTED_BY_STORE: {
    label: "Store Accepted",
    dotColor: "bg-blue-400",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-300",
  },
  REQUEST_RAISED_STORE: {
    label: "Request Raised",
    dotColor: "bg-indigo-400",
    bgColor: "bg-indigo-500/10",
    textColor: "text-indigo-300",
  },
  IN_PROGRESS: {
    label: "In Progress",
    dotColor: "bg-blue-500",
    bgColor: "bg-blue-500/15",
    textColor: "text-blue-300",
  },
  // Generic
  ACTIVE: {
    label: "Active",
    dotColor: "bg-green-400",
    bgColor: "bg-green-500/10",
    textColor: "text-green-300",
  },
  INACTIVE: {
    label: "Inactive",
    dotColor: "bg-slate-400",
    bgColor: "bg-slate-500/10",
    textColor: "text-slate-400",
  },
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "px-2.5 py-0.5 text-xs gap-1.5",
  md: "px-3 py-1 text-sm gap-2",
};

const DOT_SIZE: Record<BadgeSize, string> = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
};

interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
}

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? {
    label: status.replace(/_/g, " "),
    dotColor: "bg-slate-400",
    bgColor: "bg-slate-500/10",
    textColor: "text-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full whitespace-nowrap ${config.bgColor} ${config.textColor} ${SIZE_CLASSES[size]}`}
    >
      <span className={`rounded-full shrink-0 ${config.dotColor} ${DOT_SIZE[size]}`} />
      {config.label}
    </span>
  );
}
