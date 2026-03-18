"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";

interface DraftIndicatorProps {
  hasDraft: boolean;
  lastSaved: Date | null;
  onRestore: () => void;
  onDiscard: () => void;
}

export function DraftIndicator({
  hasDraft,
  lastSaved,
  onRestore,
  onDiscard,
}: DraftIndicatorProps) {
  if (!hasDraft || !lastSaved) return null;

  const timeAgo = formatDistanceToNow(lastSaved, { addSuffix: true });

  return (
    <div className="flex items-center gap-3 text-xs text-foreground-tertiary">
      <span>Draft saved {timeAgo}</span>
      <button
        type="button"
        onClick={onRestore}
        className="text-brand hover:text-brand-hover font-medium underline-offset-2 hover:underline"
      >
        Restore draft
      </button>
      <button
        type="button"
        onClick={onDiscard}
        className="text-foreground-muted hover:text-red-400 font-medium underline-offset-2 hover:underline"
      >
        Discard draft
      </button>
    </div>
  );
}
