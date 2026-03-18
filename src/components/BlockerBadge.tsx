"use client";

import React from "react";
import { Ban } from "lucide-react";

interface BlockerConfig {
  label: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
}

const BLOCKER_MAP: Record<string, BlockerConfig> = {
  WAITING_BUYER_DECISION: {
    label: "Waiting Buyer Decision",
    dotColor: "bg-red-400",
    bgColor: "bg-red-500/10",
    textColor: "text-red-300",
  },
  WAITING_VENDOR_CONFIRMATION: {
    label: "Waiting Vendor Confirmation",
    dotColor: "bg-red-400",
    bgColor: "bg-red-500/10",
    textColor: "text-red-300",
  },
  WAITING_FINAL_SIGNOFF: {
    label: "Waiting Final Sign-off",
    dotColor: "bg-red-400",
    bgColor: "bg-red-500/10",
    textColor: "text-red-300",
  },
  WAITING_PAYMENT: {
    label: "Waiting Payment",
    dotColor: "bg-red-400",
    bgColor: "bg-red-500/10",
    textColor: "text-red-300",
  },
  WAITING_PM_ACCEPTANCE: {
    label: "Waiting PM Acceptance",
    dotColor: "bg-orange-400",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-300",
  },
  WAITING_PM_REVIEW: {
    label: "Waiting PM Review",
    dotColor: "bg-orange-400",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-300",
  },
  WAITING_MERCH_ACCEPTANCE: {
    label: "Waiting Merch Acceptance",
    dotColor: "bg-orange-400",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-300",
  },
  WAITING_ACCOUNTANT_APPROVAL: {
    label: "Waiting Accountant Approval",
    dotColor: "bg-orange-400",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-300",
  },
  WAITING_PRODUCTION_ACCEPTANCE: {
    label: "Waiting Production Acceptance",
    dotColor: "bg-orange-400",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-300",
  },
  WAITING_STORE_ACCEPTANCE: {
    label: "Waiting Store Acceptance",
    dotColor: "bg-orange-400",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-300",
  },
  WAITING_RUNNER_ACCEPTANCE: {
    label: "Waiting Runner Acceptance",
    dotColor: "bg-orange-400",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-300",
  },
  WAITING_TECHPACK_SUBMISSION: {
    label: "Waiting Tech Pack",
    dotColor: "bg-yellow-400",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-300",
  },
  WAITING_PURCHASE_REQUEST: {
    label: "Waiting Purchase Request",
    dotColor: "bg-yellow-400",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-300",
  },
  WAITING_INVOICE_UPLOAD: {
    label: "Waiting Invoice Upload",
    dotColor: "bg-yellow-400",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-300",
  },
  WAITING_FINAL_TAX_INVOICE: {
    label: "Waiting Tax Invoice",
    dotColor: "bg-yellow-400",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-300",
  },
  WAITING_EXPENSE_COMPLETION: {
    label: "Waiting Expense Completion",
    dotColor: "bg-yellow-400",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-300",
  },
};

interface BlockerBadgeProps {
  blockerCode: string | null;
  blockerNote: string | null;
}

export function BlockerBadge({ blockerCode, blockerNote }: BlockerBadgeProps) {
  if (!blockerCode) return null;

  const config = BLOCKER_MAP[blockerCode] ?? {
    label: blockerCode.replace(/_/g, " "),
    dotColor: "bg-slate-400",
    bgColor: "bg-slate-500/10",
    textColor: "text-slate-400",
  };

  return (
    <span
      title={blockerNote ?? undefined}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${config.bgColor} ${config.textColor}`}
    >
      <Ban className="h-3 w-3 flex-shrink-0" />
      {config.label}
    </span>
  );
}
