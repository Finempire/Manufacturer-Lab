"use client";

import { useState } from "react";
import { X, Eye, EyeOff, RefreshCw, KeyRound } from "lucide-react";
import { toast } from "sonner";

interface User {
    id: string;
    name: string;
    email: string;
}

interface ResetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

export default function ResetPasswordModal({ isOpen, onClose, user }: ResetPasswordModalProps) {
    const [password, setPassword] = useState("");
    const [mustChangePassword, setMustChangePassword] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let newPassword = "";

        newPassword += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
        newPassword += "0123456789"[Math.floor(Math.random() * 10)];

        for (let i = 0, n = charset.length; i < 10; ++i) {
            newPassword += charset.charAt(Math.floor(Math.random() * n));
        }

        newPassword = newPassword.split('').sort(() => 0.5 - Math.random()).join('');
        setPassword(newPassword);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            toast.error("Password must be at least 8 characters with 1 uppercase and 1 number");
            return;
        }

        if (!confirm(`Are you sure you want to reset the password for ${user.name}? This will invalidate their current password immediately.`)) {
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    new_password: password,
                    must_change_password: mustChangePassword
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to reset password");
            }

            toast.success(`Password reset for ${user.name}`);
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-surface-2 rounded-2xl w-full max-w-md shadow-premium-xl overflow-hidden border border-amber-500/20">
                <div className="flex items-center justify-between p-5 border-b border-border-secondary bg-amber-500/10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                            <KeyRound className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Reset Password</h2>
                            <p className="text-[11px] font-medium text-foreground-tertiary">For {user.name} ({user.email})</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-foreground-muted hover:text-foreground-secondary hover:bg-surface-3 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="bg-blue-500/10 text-blue-300 text-xs p-3 rounded-lg border border-blue-500/20 mb-4">
                        Resetting the password will send an email to the user with their new temporary credentials and invalidate their current session login.
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-sm font-medium text-foreground-secondary">New Temporary Password *</label>
                            <button
                                type="button"
                                onClick={generatePassword}
                                className="text-xs text-brand hover:text-brand-hover font-medium flex items-center"
                            >
                                <RefreshCw className="w-3 h-3 mr-1" /> Generate
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-10 pl-3 pr-10 bg-surface-1 border border-border rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                                placeholder="Min 8 chars, 1 uppercase, 1 number"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground-secondary"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer mt-4">
                        <input
                            type="checkbox"
                            checked={mustChangePassword}
                            onChange={(e) => setMustChangePassword(e.target.checked)}
                            className="w-4 h-4 text-amber-600 border-border rounded focus:ring-amber-500"
                        />
                        <span className="text-sm font-medium text-foreground-secondary">Force Password Change on Next Login</span>
                    </label>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-secondary mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-foreground-secondary bg-surface-2 border border-border rounded-lg hover:bg-surface-3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 flex items-center"
                        >
                            {loading && (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            Force Password Reset
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
