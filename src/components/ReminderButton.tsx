"use client";

import { useState } from "react";
import { Bell, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  entityType: "ORDER" | "TECH_PACK" | "MATERIAL_REQUEST" | "PURCHASE" | "EXPENSE";
  entityId: string;
  targetRole?: string;
  targetUserId?: string;
  label?: string;
  size?: "sm" | "md";
}

export default function ReminderButton({
  entityType,
  entityId,
  targetRole,
  targetUserId,
  label = "Send Reminder",
  size = "sm",
}: Props) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          target_role: targetRole,
          target_user_id: targetUserId,
          reminder_type: "MANUAL",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send reminder");
      }
      setSent(true);
      toast.success("Reminder sent successfully");
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reminder");
    } finally {
      setSending(false);
    }
  };

  const sizeClasses = size === "sm"
    ? "px-2 py-1 text-xs gap-1"
    : "px-3 py-1.5 text-sm gap-1.5";

  if (sent) {
    return (
      <span className={`inline-flex items-center ${sizeClasses} font-medium text-green-700 bg-green-50 border border-green-200 rounded-md`}>
        <Check className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
        Sent
      </span>
    );
  }

  return (
    <button
      onClick={handleSend}
      disabled={sending}
      className={`inline-flex items-center ${sizeClasses} font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 disabled:opacity-50 transition`}
    >
      {sending ? (
        <Loader2 className={`animate-spin ${size === "sm" ? "w-3 h-3" : "w-4 h-4"}`} />
      ) : (
        <Bell className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      )}
      {label}
    </button>
  );
}
