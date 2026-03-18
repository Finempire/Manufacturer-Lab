"use client";

import React from "react";
import {
  AlertTriangle,
  Clock,
  FileX,
  Receipt,
  UserX,
  ShieldAlert,
  RotateCcw,
  GitBranch,
  Truck,
} from "lucide-react";

interface FlagConfig {
  label: string;
  description: string;
  icon: React.ElementType;
  classes: string;
}

const FLAG_MAP: Record<string, FlagConfig> = {
  MISSING_DOCUMENT: {
    label: "Missing Doc",
    description: "A required document is missing from this item",
    icon: FileX,
    classes: "bg-red-500/10 text-red-400",
  },
  OVERDUE_REQUIRED_DATE: {
    label: "Overdue",
    description: "The required date has passed without completion",
    icon: Clock,
    classes: "bg-red-500/10 text-red-400",
  },
  DELAYED_SHIPPING_RISK: {
    label: "Shipping Risk",
    description: "This item is at risk of delayed shipping",
    icon: Truck,
    classes: "bg-red-500/10 text-red-400",
  },
  PENDING_TAX_INVOICE: {
    label: "Tax Invoice",
    description: "Tax invoice is pending for this item",
    icon: Receipt,
    classes: "bg-orange-500/10 text-orange-400",
  },
  BLOCKED_BY_APPROVAL: {
    label: "Blocked",
    description: "This item is blocked waiting for approval",
    icon: ShieldAlert,
    classes: "bg-orange-500/10 text-orange-400",
  },
  VENDOR_MISMATCH: {
    label: "Vendor Mismatch",
    description: "Vendor information does not match across records",
    icon: UserX,
    classes: "bg-orange-500/10 text-orange-400",
  },
  HIGH_REVISION_COUNT: {
    label: "High Revisions",
    description: "This item has an unusually high number of revisions",
    icon: GitBranch,
    classes: "bg-yellow-500/10 text-yellow-400",
  },
  REOPENED_ITEM: {
    label: "Reopened",
    description: "This item was previously completed and has been reopened",
    icon: RotateCcw,
    classes: "bg-yellow-500/10 text-yellow-400",
  },
};

interface ExceptionFlagsProps {
  flags: string[];
}

export function ExceptionFlags({ flags }: ExceptionFlagsProps) {
  if (!flags || flags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((flag) => {
        const config = FLAG_MAP[flag] ?? {
          label: flag.replace(/_/g, " "),
          description: flag,
          icon: AlertTriangle,
          classes: "bg-surface-3 text-foreground-secondary",
        };
        const Icon = config.icon;

        return (
          <span
            key={flag}
            title={config.description}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${config.classes}`}
          >
            <Icon className="h-3 w-3 flex-shrink-0" />
            {config.label}
          </span>
        );
      })}
    </div>
  );
}
