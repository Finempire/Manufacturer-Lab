"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { KeyRound } from "lucide-react";

const ROLE_DASHBOARDS: Record<string, string> = {
  ACCOUNTANT: "/dashboard/accountant",
  SENIOR_MERCHANDISER: "/dashboard/senior-merchandiser",
  PRODUCTION_MANAGER: "/dashboard/production",
  MERCHANDISER: "/dashboard/merchandiser",
  STORE_MANAGER: "/dashboard/manager",
  RUNNER: "/dashboard/runner",
  CEO: "/dashboard/ceo",
};

export default function ChangePasswordPage() {
  const { data: session, update } = useSession();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error("Password must contain at least 1 uppercase letter and 1 number");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      await update({ must_change_password: false });

      const role = session?.user?.role || "";
      router.push(ROLE_DASHBOARDS[role] || "/login");
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to change password";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0">
      <div className="w-full max-w-md mx-4">
        <div className="bg-surface-1 backdrop-blur-xl border border-border rounded-2xl p-8 shadow-premium-xl">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 mb-6 mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold text-foreground text-center mb-2">Change Password Required</h2>
          <p className="text-sm text-foreground-tertiary text-center mb-8">
            For security reasons, you must change your temporary password before accessing your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="w-full h-11 px-4 bg-surface-2 border border-border rounded-lg text-foreground placeholder:text-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                className="w-full h-11 px-4 bg-surface-2 border border-border rounded-lg text-foreground placeholder:text-foreground-muted text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="bg-surface-2 rounded-lg p-3 text-xs text-foreground-muted space-y-1">
              <p className={password.length >= 8 ? "text-green-400" : ""}>
                {password.length >= 8 ? "+" : "-"} Minimum 8 characters
              </p>
              <p className={/[A-Z]/.test(password) ? "text-green-400" : ""}>
                {/[A-Z]/.test(password) ? "+" : "-"} At least 1 uppercase letter
              </p>
              <p className={/[0-9]/.test(password) ? "text-green-400" : ""}>
                {/[0-9]/.test(password) ? "+" : "-"} At least 1 number
              </p>
              <p className={password && password === confirmPassword ? "text-green-400" : ""}>
                {password && password === confirmPassword ? "+" : "-"} Passwords match
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full h-11 bg-brand hover:bg-brand-hover disabled:bg-brand/50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-all duration-200 flex items-center justify-center shadow-premium-lg"
            >
              {loading ? "Updating..." : "Set New Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
