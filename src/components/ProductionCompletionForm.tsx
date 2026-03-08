"use client";

import React, { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ProductionCompletionFormProps {
  orderId: string;
  onSubmit: (data: {
    orderId: string;
    actualCompletionDate: string;
    completionNotes: string;
  }) => Promise<void> | void;
}

export default function ProductionCompletionForm({
  orderId,
  onSubmit,
}: ProductionCompletionFormProps) {
  const [completionDate, setCompletionDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = completionDate.trim() !== "" && notes.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        orderId,
        actualCompletionDate: completionDate,
        completionNotes: notes.trim(),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit. Please retry."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Mark Production Completed
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Actual Completion Date */}
        <div>
          <label
            htmlFor="completionDate"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Actual Completion Date
          </label>
          <input
            id="completionDate"
            type="date"
            value={completionDate}
            onChange={(e) => setCompletionDate(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Completion Notes */}
        <div>
          <label
            htmlFor="completionNotes"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Completion Notes <span className="text-red-500">*</span>
          </label>
          <textarea
            id="completionNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter completion details, final counts, quality remarks..."
            rows={4}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            required
          />
          <p className="mt-1 text-xs text-slate-400">
            Required. Provide details about the production completion.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {submitting ? "Submitting..." : "Mark Production Completed"}
        </button>
      </form>
    </div>
  );
}
