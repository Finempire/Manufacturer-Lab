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
  ORDER_RECEIVED: {
    label: "Order Received",
    dotColor: "bg-slate-400",
    bgColor: "bg-slate-500/10",
    textColor: "text-slate-300",
  },
  PENDING_PM_ACCEPTANCE: {
    label: "Awaiting PM",
    dotColor: "bg-amber-400",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-300",
  },
  MERCHANDISER_ASSIGNED: {
    label: "Merch Assigned",
    dotColor: "bg-blue-400",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-300",
  },
  TECH_PACK_IN_PROGRESS: {
    label: "Tech Pack WIP",
    dotColor: "bg-blue-500",
    bgColor: "bg-blue-500/15",
    textColor: "text-blue-300",
  },
  TECH_PACK_COMPLETED: {
    label: "Tech Pack Done",
    dotColor: "bg-cyan-400",
    bgColor: "bg-cyan-500/10",
    textColor: "text-cyan-300",
  },
  MATERIAL_REQUIREMENT_SENT: {
    label: "Need Req. Sent",
    dotColor: "bg-purple-400",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-300",
  },
  MATERIAL_IN_PROGRESS: {
    label: "Material WIP",
    dotColor: "bg-indigo-400",
    bgColor: "bg-indigo-500/10",
    textColor: "text-indigo-300",
  },
  MATERIAL_COMPLETED: {
    label: "Material Done",
    dotColor: "bg-teal-400",
    bgColor: "bg-teal-500/10",
    textColor: "text-teal-300",
  },
  PRODUCTION_ACCEPTED: {
    label: "Prod. Accepted",
    dotColor: "bg-green-400",
    bgColor: "bg-green-500/10",
    textColor: "text-green-300",
  },
  UNDER_PRODUCTION: {
    label: "Under Prod.",
    dotColor: "bg-green-500",
    bgColor: "bg-green-500/15",
    textColor: "text-green-300",
  },
  PRODUCTION_COMPLETED: {
    label: "Prod. Done",
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
  PENDING_RUNNER_ACCEPTANCE: {
    label: "Awaiting Runner",
    dotColor: "bg-amber-400",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-300",
  },
  RUNNER_ACCEPTED: {
    label: "Runner Accepted",
    dotColor: "bg-blue-400",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-300",
  },
  PROVISIONAL_INVOICE_UPLOADED: {
    label: "Prov. Invoice",
    dotColor: "bg-indigo-400",
    bgColor: "bg-indigo-500/10",
    textColor: "text-indigo-300",
  },
  ACCOUNTANT_APPROVED: {
    label: "Approved",
    dotColor: "bg-green-400",
    bgColor: "bg-green-500/10",
    textColor: "text-green-300",
  },
  PAYMENT_DONE: {
    label: "Paid",
    dotColor: "bg-emerald-400",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-300",
  },
  SHOW_TO_VENDOR: {
    label: "Show to Vendor",
    dotColor: "bg-cyan-400",
    bgColor: "bg-cyan-500/10",
    textColor: "text-cyan-300",
  },
  VENDOR_CONFIRMED: {
    label: "Vendor Confirmed",
    dotColor: "bg-teal-400",
    bgColor: "bg-teal-500/10",
    textColor: "text-teal-300",
  },
  FINAL_TAX_INVOICE_UPLOADED: {
    label: "Tax Invoice Done",
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-500/15",
    textColor: "text-emerald-300",
  },
  // Expense statuses
  PENDING_APPROVAL: {
    label: "Pending Approval",
    dotColor: "bg-amber-400",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-300",
  },
  APPROVED: {
    label: "Approved",
    dotColor: "bg-green-400",
    bgColor: "bg-green-500/10",
    textColor: "text-green-300",
  },
  REJECTED: {
    label: "Rejected",
    dotColor: "bg-red-400",
    bgColor: "bg-red-500/10",
    textColor: "text-red-300",
  },
  PAID: {
    label: "Paid",
    dotColor: "bg-emerald-400",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-300",
  },
  // Tech pack statuses
  PENDING_MERCH_ACCEPTANCE: {
    label: "Awaiting Merch",
    dotColor: "bg-amber-400",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-300",
  },
  MERCH_ACCEPTED: {
    label: "Merch Accepted",
    dotColor: "bg-blue-400",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-300",
  },
  DRAFT: {
    label: "Draft",
    dotColor: "bg-slate-400",
    bgColor: "bg-slate-500/10",
    textColor: "text-slate-300",
  },
  SUBMITTED: {
    label: "Submitted",
    dotColor: "bg-blue-400",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-300",
  },
  PM_REVIEWING: {
    label: "PM Reviewing",
    dotColor: "bg-indigo-400",
    bgColor: "bg-indigo-500/10",
    textColor: "text-indigo-300",
  },
  REVISION_REQUIRED: {
    label: "Revision Req.",
    dotColor: "bg-orange-400",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-300",
  },
  SENT_TO_BUYER: {
    label: "Sent to Buyer",
    dotColor: "bg-purple-400",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-300",
  },
  BUYER_APPROVED: {
    label: "Buyer Approved",
    dotColor: "bg-green-400",
    bgColor: "bg-green-500/10",
    textColor: "text-green-300",
  },
  BUYER_REJECTED: {
    label: "Buyer Rejected",
    dotColor: "bg-red-400",
    bgColor: "bg-red-500/10",
    textColor: "text-red-300",
  },
  // Material requirement statuses
  PENDING_STORE_ACCEPTANCE: {
    label: "Awaiting Store",
    dotColor: "bg-amber-400",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-300",
  },
  STORE_ACCEPTED: {
    label: "Store Accepted",
    dotColor: "bg-blue-400",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-300",
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
