"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ROLE_DASHBOARDS: Record<string, string> = {
    ACCOUNTANT: "/dashboard/accountant",
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
                toast.error("Invalid credentials");
                setLoading(false);
                return;
            }

            // Fetch session to get role
            const sessionRes = await fetch("/api/auth/session");
            const session = await sessionRes.json();
            const role = session?.user?.role;

            toast.success("Logged in successfully");
            router.push(ROLE_DASHBOARDS[role] || "/dashboard/accountant");
            router.refresh();
        } catch {
            toast.error("An error occurred. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            <div className="w-full max-w-md mx-4">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">CashFlow</h1>
                    <p className="text-blue-300/70 mt-1 text-sm">Order-to-Payment Management System</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-xs font-medium text-blue-200/80 mb-1.5">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="you@cashflow.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-medium text-blue-200/80 mb-1.5">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                className="w-full h-11 px-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium text-sm rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-xs text-blue-200/50 text-center mb-3">Demo Credentials (all use password: Change@123)</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { email: "accountant@cashflow.com", label: "Accountant" },
                                { email: "production@cashflow.com", label: "Production" },
                                { email: "merch@cashflow.com", label: "Merchandiser" },
                                { email: "manager@cashflow.com", label: "Store Mgr" },
                                { email: "runner@cashflow.com", label: "Runner" },
                                { email: "ceo@cashflow.com", label: "CEO" },
                            ].map((cred) => (
                                <button
                                    key={cred.email}
                                    type="button"
                                    onClick={() => {
                                        setEmail(cred.email);
                                        setPassword("Change@123");
                                    }}
                                    className="px-3 py-1.5 text-[11px] font-medium text-blue-200/70 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all"
                                >
                                    {cred.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
