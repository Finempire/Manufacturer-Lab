"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Shield, UserX, UserCheck, KeyRound, Edit, Mail } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

// Assuming we will create these modals next
import AddUserModal from "@/components/AddUserModal";
import EditUserModal from "@/components/EditUserModal";
import ResetPasswordModal from "@/components/ResetPasswordModal";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
}

export default function UsersPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [resettingUser, setResettingUser] = useState<User | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/users");
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
        const matchesStatus =
            statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" ? user.is_active : !user.is_active);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const handleDeactivateToggle = async (user: User) => {
        // Prevent self-deactivation
        if (session?.user?.id === user.id) {
            toast.error("You cannot deactivate yourself");
            return;
        }

        const action = user.is_active ? "deactivate" : "activate";
        if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    is_active: !user.is_active,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Failed to ${action} user`);
            }

            toast.success(`User ${action}d successfully`);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const roles = ["ACCOUNTANT", "PRODUCTION_MANAGER", "MERCHANDISER", "STORE_MANAGER", "RUNNER", "CEO"];
    const roleStats = roles.reduce((acc, role) => {
        acc[role] = users.filter((u) => u.role === role && u.is_active).length;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">User Management</h1>
                    <p className="text-sm text-foreground-tertiary mt-1">Manage system accounts and roles</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {roles.map((role) => (
                    <div key={role} className="bg-surface-1 px-4 py-3 rounded-lg border border-border">
                        <p className="text-[10px] font-semibold text-foreground-tertiary uppercase tracking-wider truncate">
                            {role.replace("_", " ")}
                        </p>
                        <p className="text-lg font-semibold tracking-tight text-foreground mt-1">{roleStats[role] || 0}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-surface-1 p-4 rounded-lg border border-border flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full sm:w-48 px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    <option value="ALL">All Roles</option>
                    {roles.map(role => (
                        <option key={role} value={role}>{role.replace("_", " ")}</option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-32 px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-surface-1 border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-surface-2 text-xs text-foreground-tertiary uppercase border-b border-border">
                            <tr>
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Last Login</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-foreground-tertiary">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-foreground-tertiary">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-surface-2 text-foreground-secondary">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-foreground-secondary font-medium">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">{user.name}</p>
                                                    <div className="flex items-center gap-1 text-xs text-foreground-tertiary">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                                <Shield className="w-3.5 h-3.5" />
                                                {user.role.replace("_", " ")}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${user.is_active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                                {user.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-foreground-tertiary whitespace-nowrap">
                                            {user.last_login_at
                                                ? new Date(user.last_login_at).toLocaleString()
                                                : "Never"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingUser(user)}
                                                    className="p-1.5 text-foreground-muted hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                                    title="Edit user"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setResettingUser(user)}
                                                    className="p-1.5 text-foreground-muted hover:text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
                                                    title="Reset password"
                                                >
                                                    <KeyRound className="w-4 h-4" />
                                                </button>
                                                {session?.user?.id !== user.id && (
                                                    <button
                                                        onClick={() => handleDeactivateToggle(user)}
                                                        className={`p-1.5 rounded-lg transition-colors ${user.is_active
                                                            ? "text-foreground-muted hover:text-red-600 hover:bg-red-50"
                                                            : "text-foreground-muted hover:text-emerald-600 hover:bg-emerald-50"
                                                            }`}
                                                        title={user.is_active ? "Deactivate user" : "Activate user"}
                                                    >
                                                        {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals placeholders */}
            {isAddModalOpen && (
                <AddUserModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={fetchUsers}
                />
            )}

            {editingUser && (
                <EditUserModal
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={fetchUsers}
                    user={editingUser}
                />
            )}

            {resettingUser && (
                <ResetPasswordModal
                    isOpen={!!resettingUser}
                    onClose={() => setResettingUser(null)}
                    user={resettingUser}
                />
            )}
        </div>
    );
}

