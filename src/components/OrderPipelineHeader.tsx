"use client";

import React from "react";
import {
  ClipboardList,
  UserCheck,
  UserPlus,
  FileEdit,
  FilePlus,
  Eye,
  Share2,
  ThumbsUp,
  FileCheck,
  Send,
  PackageCheck,
  Boxes,
  Package,
  Factory,
  Hammer,
  CheckCheck,
  Award,
} from "lucide-react";

interface PipelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
}

const PIPELINE_STEPS: PipelineStep[] = [
  { key: "order_created", label: "Order Created", icon: ClipboardList },
  { key: "pm_accepted", label: "PM Accepted", icon: UserCheck },
  { key: "merch_assigned", label: "Merch Assigned", icon: UserPlus },
  { key: "tech_pack_in_progress", label: "Tech Pack WIP", icon: FileEdit },
  { key: "tech_pack_submitted", label: "Tech Pack Submitted", icon: FilePlus },
  { key: "pm_reviewed", label: "PM Reviewed", icon: Eye },
  { key: "shared_with_buyer", label: "Shared with Buyer", icon: Share2 },
  { key: "buyer_decision", label: "Buyer Decision", icon: ThumbsUp },
  { key: "tech_pack_completed", label: "Tech Pack Done", icon: FileCheck },
  { key: "material_need_sent", label: "Need Req. Sent", icon: Send },
  { key: "sm_accepted", label: "SM Accepted", icon: PackageCheck },
  { key: "materials_in_progress", label: "Material WIP", icon: Boxes },
  { key: "materials_completed", label: "Material Done", icon: Package },
  { key: "production_accepted", label: "Prod. Accepted", icon: Factory },
  { key: "under_production", label: "Under Production", icon: Hammer },
  { key: "production_completed", label: "Prod. Completed", icon: CheckCheck },
  { key: "order_completed", label: "Completed", icon: Award },
];

const STATUS_TO_STEP_INDEX: Record<string, number> = {
  ORDER_RECEIVED: 0,
  PENDING_PM_ACCEPTANCE: 1,
  MERCHANDISER_ASSIGNED: 2,
  TECH_PACK_IN_PROGRESS: 3,
  TECH_PACK_COMPLETED: 8,
  MATERIAL_REQUIREMENT_SENT: 9,
  MATERIAL_IN_PROGRESS: 11,
  MATERIAL_COMPLETED: 12,
  PRODUCTION_ACCEPTED: 13,
  UNDER_PRODUCTION: 14,
  PRODUCTION_COMPLETED: 15,
  COMPLETED: 16,
  CANCELLED: -1,
};

interface OrderPipelineHeaderProps {
  status: string;
}

export default function OrderPipelineHeader({ status }: OrderPipelineHeaderProps) {
  const currentStepIndex = STATUS_TO_STEP_INDEX[status] ?? 0;
  const isCancelled = status === "CANCELLED";

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2 px-1">
      {PIPELINE_STEPS.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = !isCancelled && index < currentStepIndex;
        const isCurrent = !isCancelled && index === currentStepIndex;
        const isUpcoming = isCancelled || index > currentStepIndex;
        const isLast = index === PIPELINE_STEPS.length - 1;

        return (
          <React.Fragment key={step.key}>
            {/* Step icon with tooltip */}
            <div className="relative group shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  isCompleted
                    ? "bg-brand text-white"
                    : isCurrent
                      ? "bg-surface-1 text-brand ring-2 ring-brand"
                      : "bg-surface-1 text-foreground-muted border border-border-secondary"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-surface-2 text-foreground text-xs font-medium rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none shadow-premium-md">
                {step.label}
                {isCompleted && <span className="text-green-400 ml-1">Done</span>}
                {isCurrent && <span className="text-brand ml-1">Current</span>}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                  <div className="w-2 h-2 bg-surface-2 rotate-45 -translate-y-1" />
                </div>
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={`h-0.5 w-4 shrink-0 ${
                  isCompleted && !isCancelled && index < currentStepIndex - 1
                    ? "bg-brand"
                    : isCompleted
                      ? "bg-brand"
                      : isUpcoming
                        ? "bg-border-secondary"
                        : "bg-border-secondary"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
