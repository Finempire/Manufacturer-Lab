"use client";

import { startOfDay, subDays, startOfWeek, startOfMonth, format } from "date-fns";

interface DatePresetsProps {
  onSelect: (from: string, to: string) => void;
  activePreset?: string;
}

const presets = [
  { label: "Today", key: "today", from: () => startOfDay(new Date()), to: () => new Date() },
  { label: "Yesterday", key: "yesterday", from: () => startOfDay(subDays(new Date(), 1)), to: () => startOfDay(new Date()) },
  { label: "7 Days", key: "7d", from: () => startOfDay(subDays(new Date(), 7)), to: () => new Date() },
  { label: "30 Days", key: "30d", from: () => startOfDay(subDays(new Date(), 30)), to: () => new Date() },
  { label: "This Week", key: "week", from: () => startOfWeek(new Date(), { weekStartsOn: 1 }), to: () => new Date() },
  { label: "This Month", key: "month", from: () => startOfMonth(new Date()), to: () => new Date() },
];

export function DatePresets({ onSelect, activePreset }: DatePresetsProps) {
  return (
    <div className="flex items-center gap-1">
      {presets.map((p) => (
        <button
          key={p.key}
          onClick={() => onSelect(format(p.from(), "yyyy-MM-dd"), format(p.to(), "yyyy-MM-dd"))}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            activePreset === p.key
              ? "bg-brand-muted text-brand font-medium"
              : "text-foreground-tertiary hover:bg-surface-3"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
