"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Clock, LogOut } from "lucide-react";

const INACTIVITY_WARNING_MS = 25 * 60 * 1000; // 25 minutes
const INACTIVITY_LOGOUT_MS = 30 * 60 * 1000; // 30 minutes

export default function SessionTimeoutWarning() {
  const { data: session, update } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  }, []);

  const handleLogout = useCallback(() => {
    clearTimers();
    signOut({ callbackUrl: "/login" });
  }, [clearTimers]);

  const resetTimers = useCallback(() => {
    if (!session) return;
    clearTimers();
    setShowWarning(false);

    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVITY_WARNING_MS);

    logoutTimerRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_LOGOUT_MS);
  }, [session, clearTimers, handleLogout]);

  const handleContinueSession = useCallback(async () => {
    setShowWarning(false);
    await update();
    resetTimers();
  }, [update, resetTimers]);

  // Set up activity listeners
  useEffect(() => {
    if (!session) return;

    const activityEvents = ["mousemove", "keydown", "click"];

    const onActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    activityEvents.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true })
    );
    resetTimers();

    return () => {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, onActivity)
      );
      clearTimers();
    };
  }, [session, showWarning, resetTimers, clearTimers]);

  if (!session || !showWarning) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            Session Expiring
          </h2>
        </div>

        <p className="mb-6 text-sm text-slate-600">
          Your session will expire in 5 minutes due to inactivity. Would you
          like to continue working?
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
          <button
            onClick={handleContinueSession}
            className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Continue Session
          </button>
        </div>
      </div>
    </div>
  );
}
