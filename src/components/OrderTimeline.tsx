"use client";

import React from "react";
import {
  ClipboardList,
  UserCheck,
  UserPlus,
  CheckCircle2,
  FileEdit,
  FilePlus,
  Eye,
  Share2,
  ThumbsUp,
  FileCheck,
  Send,
  PackageCheck,
  ShoppingCart,
  Boxes,
  Package,
  Factory,
  Hammer,
  CheckCheck,
  Award,
} from "lucide-react";
import { format } from "date-fns";

interface TimelineStepConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  timestampField: string;
  actorField: string;
}

const TIMELINE_STEPS: TimelineStepConfig[] = [
  {
    key: "order_created",
    label: "Order Created",
    icon: ClipboardList,
    timestampField: "createdAt",
    actorField: "createdByName",
  },
  {
    key: "pm_accepted",
    label: "PM Accepted",
    icon: UserCheck,
    timestampField: "pmAcceptedAt",
    actorField: "pmName",
  },
  {
    key: "merch_assigned",
    label: "Merch Assigned",
    icon: UserPlus,
    timestampField: "merchAssignedAt",
    actorField: "pmName",
  },
  {
    key: "merch_accepted",
    label: "Merch Accepted",
    icon: CheckCircle2,
    timestampField: "merchAcceptedAt",
    actorField: "merchandiserName",
  },
  {
    key: "tech_pack_in_progress",
    label: "Tech Pack In Progress",
    icon: FileEdit,
    timestampField: "techPackStartedAt",
    actorField: "merchandiserName",
  },
  {
    key: "tech_pack_submitted",
    label: "Tech Pack Submitted",
    icon: FilePlus,
    timestampField: "techPackSubmittedAt",
    actorField: "merchandiserName",
  },
  {
    key: "pm_reviewed",
    label: "PM Reviewed",
    icon: Eye,
    timestampField: "pmReviewedAt",
    actorField: "pmName",
  },
  {
    key: "shared_with_buyer",
    label: "Shared with Buyer",
    icon: Share2,
    timestampField: "sharedWithBuyerAt",
    actorField: "pmName",
  },
  {
    key: "buyer_decision",
    label: "Buyer Decision",
    icon: ThumbsUp,
    timestampField: "buyerDecisionAt",
    actorField: "buyerName",
  },
  {
    key: "tech_pack_completed",
    label: "Tech Pack Completed",
    icon: FileCheck,
    timestampField: "techPackCompletedAt",
    actorField: "pmName",
  },
  {
    key: "material_need_request_sent",
    label: "Material Need Request Sent",
    icon: Send,
    timestampField: "materialNeedRequestSentAt",
    actorField: "merchandiserName",
  },
  {
    key: "sm_accepted_need_request",
    label: "SM Accepted Need Request",
    icon: PackageCheck,
    timestampField: "smAcceptedNeedRequestAt",
    actorField: "smName",
  },
  {
    key: "purchase_requests_raised",
    label: "Purchase Requests Raised",
    icon: ShoppingCart,
    timestampField: "purchaseRequestsRaisedAt",
    actorField: "smName",
  },
  {
    key: "materials_in_progress",
    label: "Materials In Progress",
    icon: Boxes,
    timestampField: "materialsInProgressAt",
    actorField: "smName",
  },
  {
    key: "all_materials_completed",
    label: "All Materials Completed",
    icon: Package,
    timestampField: "allMaterialsCompletedAt",
    actorField: "smName",
  },
  {
    key: "production_accepted",
    label: "Production Accepted",
    icon: Factory,
    timestampField: "productionAcceptedAt",
    actorField: "pmName",
  },
  {
    key: "under_production",
    label: "Under Production",
    icon: Hammer,
    timestampField: "underProductionAt",
    actorField: "pmName",
  },
  {
    key: "production_completed",
    label: "Production Completed",
    icon: CheckCheck,
    timestampField: "productionCompletedAt",
    actorField: "pmName",
  },
  {
    key: "order_completed",
    label: "Order Completed",
    icon: Award,
    timestampField: "completedAt",
    actorField: "completedByName",
  },
];

interface OrderTimelineProps {
  order: Record<string, unknown>;
}

function getStepStatus(
  order: Record<string, unknown>,
  steps: TimelineStepConfig[],
  index: number
): "completed" | "current" | "upcoming" {
  const step = steps[index];
  const hasTimestamp = !!order[step.timestampField];

  if (hasTimestamp) return "completed";

  const prevCompleted =
    index === 0 || !!order[steps[index - 1].timestampField];
  if (prevCompleted) return "current";

  return "upcoming";
}

function formatTimestamp(value: unknown): string {
  if (!value) return "";
  try {
    return format(new Date(value as string), "dd MMM yyyy, hh:mm a");
  } catch {
    return String(value);
  }
}

export default function OrderTimeline({ order }: OrderTimelineProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Order Timeline
      </h3>
      <div className="relative">
        {TIMELINE_STEPS.map((step, index) => {
          const status = getStepStatus(order, TIMELINE_STEPS, index);
          const Icon = step.icon;
          const timestamp = formatTimestamp(order[step.timestampField]);
          const actor = order[step.actorField] as string | undefined;
          const isLast = index === TIMELINE_STEPS.length - 1;

          return (
            <div key={step.key} className="relative flex gap-3 pb-6 last:pb-0">
              {/* Vertical connector line */}
              {!isLast && (
                <div
                  className={`absolute left-4 top-8 w-0.5 h-full -translate-x-1/2 ${
                    status === "completed"
                      ? "bg-green-300"
                      : status === "current"
                        ? "bg-blue-300"
                        : "border-l border-dashed border-gray-300"
                  }`}
                />
              )}

              {/* Icon circle */}
              <div
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                  status === "completed"
                    ? "bg-green-100 text-green-600"
                    : status === "current"
                      ? "bg-blue-100 text-blue-600 ring-2 ring-blue-300"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p
                  className={`text-sm font-medium ${
                    status === "completed"
                      ? "text-gray-900"
                      : status === "current"
                        ? "text-blue-700"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
                {status === "completed" && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    {timestamp && (
                      <span className="text-xs text-gray-500">{timestamp}</span>
                    )}
                    {actor && (
                      <span className="text-xs text-gray-500">
                        by {actor}
                      </span>
                    )}
                  </div>
                )}
                {status === "current" && (
                  <span className="text-xs text-blue-500 mt-0.5 inline-block">
                    Pending
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
