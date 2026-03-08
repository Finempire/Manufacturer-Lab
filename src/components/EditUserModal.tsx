"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
}

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user: User;
}

export default function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
    const { data: session } = useSession();
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [role, setRole] = useState(user.role);
    const [isActive, setIsActive] = useState(user.is_active);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role);
            setIsActive(user.is_active);
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const isSelfEdit = session?.user?.id === user.id;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSelfEdit && (!isActive || role !== "ACCOUNTANT")) {
            toast.error("You cannot change your own role or deactivate yourself");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    role,
                    is_active: isActive,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update user");
            }

            toast.success("User updated successfully");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <h2 className="text-xl font-semibold text-slate-900">Edit User Details</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                        <input
                            type="text"
                            required
                            minLength={2}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address *</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Role *</label>
                        <select
                            required
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            disabled={isSelfEdit}
                            className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                        >
                            <option value="STORE_MANAGER">Store Manager</option>
                            <option value="RUNNER">Runner</option>
                            <option value="PRODUCTION_MANAGER">Production Manager</option>
                            <option value="MERCHANDISER">Merchandiser</option>
                            <option value="CEO">CEO</option>
                            <option value="ACCOUNTANT">Accountant</option>
                        </select>
                        {isSelfEdit && (
                            <p className="text-xs text-amber-600 mt-1">You cannot change your own role.</p>
                        )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer mt-2">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                disabled={isSelfEdit}
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className={`text-sm font-medium ${isSelfEdit ? "text-slate-400" : "text-slate-700"}`}>
                                Account is Active
                            </span>
                        </label>
                        {isSelfEdit && (
                            <p className="text-xs text-amber-600 mt-1">You cannot deactivate your own account.</p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                        >
                            {loading && (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
