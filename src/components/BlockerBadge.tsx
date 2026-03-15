"use client";

import React from "react";
import { Ban } from "lucide-react";

interface BlockerConfig {
  label: string;
  classes: string;
}

const BLOCKER_MAP: Record<string, BlockerConfig> = {
  // High severity — red: waiting on external parties or final steps
  WAITING_BUYER_DECISION: {
    label: "Waiting Buyer Decision",
    classes: "bg-red-50 text-red-700 ring-red-200",
  },
  WAITING_VENDOR_CONFIRMATION: {
    label: "Waiting Vendor Confirmation",
    classes: "bg-red-50 text-red-700 ring-red-200",
  },
  WAITING_FINAL_SIGNOFF: {
    label: "Waiting Final Sign-off",
    classes: "bg-red-50 text-red-700 ring-red-200",
  },
  WAITING_PAYMENT: {
    label: "Waiting Payment",
    classes: "bg-red-50 text-red-700 ring-red-200",
  },

  // Medium severity — orange: internal workflow approvals
  WAITING_PM_ACCEPTANCE: {
    label: "Waiting PM Acceptance",
    classes: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  WAITING_PM_REVIEW: {
    label: "Waiting PM Review",
    classes: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  WAITING_MERCH_ACCEPTANCE: {
    label: "Waiting Merch Acceptance",
    classes: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  WAITING_ACCOUNTANT_APPROVAL: {
    label: "Waiting Accountant Approval",
    classes: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  WAITING_PRODUCTION_ACCEPTANCE: {
    label: "Waiting Production Acceptance",
    classes: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  WAITING_STORE_ACCEPTANCE: {
    label: "Waiting Store Acceptance",
    classes: "bg-orange-50 text-orange-700 ring-orange-200",
  },
  WAITING_RUNNER_ACCEPTANCE: {
    label: "Waiting Runner Acceptance",
    classes: "bg-orange-50 text-orange-700 ring-orange-200",
  },

  // Lower severity — yellow: pending submissions/uploads
  WAITING_TECHPACK_SUBMISSION: {
    label: "Waiting Tech Pack",
    classes: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  },
  WAITING_PURCHASE_REQUEST: {
    label: "Waiting Purchase Request",
    classes: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  },
  WAITING_INVOICE_UPLOAD: {
    label: "Waiting Invoice Upload",
    classes: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  },
  WAITING_FINAL_TAX_INVOICE: {
    label: "Waiting Tax Invoice",
    classes: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  },
  WAITING_EXPENSE_COMPLETION: {
    label: "Waiting Expense Completion",
    classes: "bg-yellow-50 text-yellow-700 ring-yellow-200",
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
    classes: "bg-gray-50 text-gray-600 ring-gray-200",
  };

  return (
    <span
      title={blockerNote ?? undefined}
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ring-1 whitespace-nowrap ${config.classes}`}
    >
      <Ban className="h-3 w-3 flex-shrink-0" />
      {config.label}
    </span>
  );
}
