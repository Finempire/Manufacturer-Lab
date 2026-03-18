"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

interface PipelineOrder {
  id: string;
  orderNumber: string;
  buyerName?: string;
  styleName?: string;
  status: string;
  quantity?: number;
  targetDate?: string;
  assignedTo?: string;
  totalAmount?: number;
}

interface SectionConfig {
  title: string;
  statuses: string[];
  columns: ColumnDef[];
}

interface ColumnDef {
  key: string;
  label: string;
  render?: (order: PipelineOrder) => React.ReactNode;
}

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: "orderNumber", label: "Order #" },
  { key: "buyerName", label: "Buyer" },
  { key: "styleName", label: "Style" },
  {
    key: "status",
    label: "Status",
    render: (order) => <StatusBadge status={order.status} />,
  },
  { key: "quantity", label: "Qty" },
  { key: "targetDate", label: "Target Date" },
  { key: "assignedTo", label: "Assigned To" },
];

const SECTIONS: SectionConfig[] = [
  {
    title: "Under Tech Pack",
    statuses: [
      "PENDING_PM_ACCEPTANCE",
      "MERCHANDISER_ASSIGNED",
      "TECH_PACK_IN_PROGRESS",
      "TECH_PACK_COMPLETED",
    ],
    columns: DEFAULT_COLUMNS,
  },
  {
    title: "Under Material / Expense",
    statuses: ["MATERIAL_REQUIREMENT_SENT", "MATERIAL_IN_PROGRESS"],
    columns: DEFAULT_COLUMNS,
  },
  {
    title: "Under Production",
    statuses: ["MATERIAL_COMPLETED", "PRODUCTION_ACCEPTED", "UNDER_PRODUCTION"],
    columns: DEFAULT_COLUMNS,
  },
  {
    title: "Production Completed",
    statuses: ["PRODUCTION_COMPLETED"],
    columns: [
      ...DEFAULT_COLUMNS,
      {
        key: "totalAmount",
        label: "Total Amount",
        render: (order) =>
          order.totalAmount != null
            ? `Rs. ${order.totalAmount.toLocaleString()}`
            : "-",
      },
    ],
  },
];

interface OrderPipelineProps {
  orders: PipelineOrder[];
  role?: string;
  onMarkCompleted?: (orderId: string) => void;
  markCompletedLoading?: string | null;
}

function PipelineSection({
  section,
  orders,
  role,
  onMarkCompleted,
  markCompletedLoading,
}: {
  section: SectionConfig;
  orders: PipelineOrder[];
  role?: string;
  onMarkCompleted?: (orderId: string) => void;
  markCompletedLoading?: string | null;
}) {
  const [expanded, setExpanded] = useState(true);
  const sectionOrders = orders.filter((o) =>
    section.statuses.includes(o.status)
  );
  const count = sectionOrders.length;

  const showMarkCompleted =
    section.title === "Production Completed" &&
    role === "ACCOUNTANT" &&
    !!onMarkCompleted;

  return (
    <div className="bg-surface-1 rounded-xl shadow-premium-sm border border-border-secondary">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-3 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-foreground-tertiary" />
          ) : (
            <ChevronRight className="w-4 h-4 text-foreground-tertiary" />
          )}
          <h3 className="text-sm font-semibold text-foreground">
            {section.title}
          </h3>
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full bg-surface-3 text-foreground-secondary">
            {count}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border-secondary">
          {count === 0 ? (
            <div className="p-4 text-sm text-foreground-muted text-center">
              No orders in this stage.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-secondary bg-surface-0">
                    {section.columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-2 text-left text-xs font-medium text-foreground-tertiary uppercase tracking-wider"
                      >
                        {col.label}
                      </th>
                    ))}
                    {showMarkCompleted && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-foreground-tertiary uppercase tracking-wider">
                        Action
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-secondary">
                  {sectionOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-surface-3 transition-colors"
                    >
                      {section.columns.map((col) => (
                        <td
                          key={col.key}
                          className="px-4 py-3 text-sm text-foreground-secondary whitespace-nowrap"
                        >
                          {col.render
                            ? col.render(order)
                            : (order[col.key as keyof PipelineOrder] as React.ReactNode) ??
                              "-"}
                        </td>
                      ))}
                      {showMarkCompleted && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            disabled={markCompletedLoading === order.id}
                            onClick={() => onMarkCompleted?.(order.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {markCompletedLoading === order.id
                              ? "Processing..."
                              : "Mark Completed"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrderPipeline({
  orders,
  role,
  onMarkCompleted,
  markCompletedLoading,
}: OrderPipelineProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Live Order Pipeline
      </h2>
      {SECTIONS.map((section) => (
        <PipelineSection
          key={section.title}
          section={section}
          orders={orders}
          role={role}
          onMarkCompleted={onMarkCompleted}
          markCompletedLoading={markCompletedLoading}
        />
      ))}
    </div>
  );
}
