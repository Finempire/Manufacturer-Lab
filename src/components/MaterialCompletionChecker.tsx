"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Receipt,
} from "lucide-react";

interface MaterialRequest {
  id: string;
  materialName: string;
  status: string;
  quantity?: number;
  unit?: string;
}

interface ExpenseRequest {
  id: string;
  description: string;
  status: string;
  amount?: number;
}

interface MaterialCompletionCheckerProps {
  orderId: string;
  styleName?: string;
  materialRequests: MaterialRequest[];
  expenseRequests: ExpenseRequest[];
  onMarkCompleted: (orderId: string) => Promise<void> | void;
}

export default function MaterialCompletionChecker({
  orderId,
  styleName,
  materialRequests,
  expenseRequests,
  onMarkCompleted,
}: MaterialCompletionCheckerProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedMaterials = materialRequests.filter(
    (m) => m.status === "COMPLETED" || m.status === "DELIVERED"
  );
  const completedExpenses = expenseRequests.filter(
    (e) => e.status === "COMPLETED" || e.status === "PAID"
  );

  const allMaterialsDone = completedMaterials.length === materialRequests.length;
  const allExpensesDone = completedExpenses.length === expenseRequests.length;
  const allDone =
    allMaterialsDone &&
    allExpensesDone &&
    materialRequests.length > 0;

  const pendingMaterials = materialRequests.filter(
    (m) => m.status !== "COMPLETED" && m.status !== "DELIVERED"
  );
  const pendingExpenses = expenseRequests.filter(
    (e) => e.status !== "COMPLETED" && e.status !== "PAID"
  );

  async function handleMarkCompleted() {
    if (!allDone) return;
    setError(null);
    setSubmitting(true);
    try {
      await onMarkCompleted(orderId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to mark completed."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-surface-1 rounded-xl shadow-premium-sm border border-border-secondary p-4">
      <h3 className="text-lg font-semibold text-foreground mb-1">
        Material and Expense Completion
      </h3>
      {styleName && (
        <p className="text-sm text-foreground-tertiary mb-4">Style: {styleName}</p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Materials summary */}
        <div
          className={`rounded-md border p-3 ${
            allMaterialsDone
              ? "border-green-500/20 bg-green-500/10"
              : "border-amber-500/20 bg-amber-500/10"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Package
              className={`w-4 h-4 ${allMaterialsDone ? "text-green-400" : "text-amber-400"}`}
            />
            <span className="text-sm font-medium text-foreground">
              Material Requests
            </span>
          </div>
          <p className="text-xs text-foreground-secondary">
            {completedMaterials.length} / {materialRequests.length} completed
          </p>
        </div>

        {/* Expenses summary */}
        <div
          className={`rounded-md border p-3 ${
            allExpensesDone
              ? "border-green-500/20 bg-green-500/10"
              : "border-amber-500/20 bg-amber-500/10"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Receipt
              className={`w-4 h-4 ${allExpensesDone ? "text-green-400" : "text-amber-400"}`}
            />
            <span className="text-sm font-medium text-foreground">
              Expense Requests
            </span>
          </div>
          <p className="text-xs text-foreground-secondary">
            {completedExpenses.length} / {expenseRequests.length} completed
          </p>
        </div>
      </div>

      {/* Pending items */}
      {(pendingMaterials.length > 0 || pendingExpenses.length > 0) && (
        <div className="mb-4 space-y-2">
          {pendingMaterials.length > 0 && (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium text-amber-300">
                  Pending Materials
                </span>
              </div>
              <ul className="text-xs text-amber-300 space-y-0.5 ml-5 list-disc">
                {pendingMaterials.map((m) => (
                  <li key={m.id}>
                    {m.materialName}
                    {m.quantity != null && m.unit
                      ? ` (${m.quantity} ${m.unit})`
                      : ""}
                    {" "}&mdash; {m.status.replace(/_/g, " ")}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pendingExpenses.length > 0 && (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium text-amber-300">
                  Pending Expenses
                </span>
              </div>
              <ul className="text-xs text-amber-300 space-y-0.5 ml-5 list-disc">
                {pendingExpenses.map((e) => (
                  <li key={e.id}>
                    {e.description}
                    {e.amount != null ? ` (Rs. ${e.amount.toLocaleString()})` : ""}
                    {" "}&mdash; {e.status.replace(/_/g, " ")}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Action button */}
      {allDone ? (
        <button
          type="button"
          onClick={handleMarkCompleted}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {submitting
            ? "Processing..."
            : "Mark All Materials & Expenses Completed"}
        </button>
      ) : (
        <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
          <AlertCircle className="w-4 h-4 text-foreground-muted" />
          <span>
            All material requests and expenses must be completed before marking
            this order.
          </span>
        </div>
      )}
    </div>
  );
}
