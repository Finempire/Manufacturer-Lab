"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, LogIn, Factory } from "lucide-react";

const ROLE_DASHBOARDS: Record<string, string> = {
  ACCOUNTANT: "/dashboard/accountant",
  SENIOR_MERCHANDISER: "/dashboard/senior-merchandiser",
  PRODUCTION_MANAGER: "/dashboard/production",
  MERCHANDISER: "/dashboard/merchandiser",
  STORE_MANAGER: "/dashboard/manager",
  RUNNER: "/dashboard/runner",
  CEO: "/dashboard/ceo",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error === "CredentialsSignin" ? "Invalid credentials" : result.error);
        setLoading(false);
        return;
      }

      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;

      toast.success("Signed in successfully");
      router.push(ROLE_DASHBOARDS[role] || "/dashboard/accountant");
      router.refresh();
    } catch {
      toast.error("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-surface-0 flex items-center justify-center font-sans">
      <div className="w-full max-w-[420px] px-4">
        {/* Header / Brand */}
        <div className="flex flex-col items-center mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            The Manufacturer Club
          </h1>
          <p className="text-sm text-foreground-secondary font-medium mt-1 flex items-center gap-1.5">
            <Factory className="w-4 h-4" /> Global Production Tracking
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-1 border border-border rounded-2xl p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground-secondary block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-foreground-tertiary" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 transition-colors"
                  placeholder="you@manufacturer.club"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground-secondary block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-foreground-tertiary" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 transition-colors"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-brand hover:bg-brand-hover disabled:bg-brand/50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  Sign In
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-foreground-muted mt-8 font-medium">
          &copy; 2026 The Manufacturer Club Systems
        </p>
      </div>
    </div>
  );
}
