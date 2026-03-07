"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { KeyRound } from "lucide-react";

const ROLE_DASHBOARDS: Record<string, string> = {
  ACCOUNTANT: "/dashboard/accountant",
  SAMPLE_PRODUCTION_MANAGER: "/dashboard/sample-pm",
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 mb-6 mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold text-white text-center mb-2">Change Password Required</h2>
          <p className="text-sm text-blue-200/60 text-center mb-8">
            For security reasons, you must change your temporary password before accessing your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-blue-200/70 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-blue-200/70 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="bg-white/5 rounded-lg p-3 text-xs text-blue-200/50 space-y-1">
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
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg shadow-blue-600/25"
            >
              {loading ? "Updating..." : "Set New Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
