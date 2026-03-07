"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
    LogOut, Menu, Bell, User as UserIcon, X,
    LayoutDashboard, ShoppingCart, CreditCard, FileText,
    Package, Users, Boxes, ClipboardList, Truck,
    BarChart3, Settings, Receipt, Palette
} from "lucide-react";

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
}

const NAV_ITEMS: Record<string, NavItem[]> = {
    ACCOUNTANT: [
        { path: "/dashboard/accountant", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { path: "/dashboard/accountant/orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" /> },
        { path: "/dashboard/accountant/purchases-review", label: "Purchases Review", icon: <ClipboardList className="w-4 h-4" /> },
        { path: "/dashboard/accountant/payments", label: "Payments", icon: <CreditCard className="w-4 h-4" /> },
        { path: "/dashboard/accountant/expense-requests", label: "Expense Requests", icon: <Receipt className="w-4 h-4" /> },
        { path: "/dashboard/accountant/reports", label: "Reports", icon: <BarChart3 className="w-4 h-4" /> },
        { path: "/dashboard/accountant/master/vendors", label: "Vendors", icon: <Users className="w-4 h-4" /> },
        { path: "/dashboard/accountant/master/buyers", label: "Buyers", icon: <Users className="w-4 h-4" /> },
        { path: "/dashboard/accountant/master/materials", label: "Materials", icon: <Boxes className="w-4 h-4" /> },
        { path: "/dashboard/accountant/master/styles", label: "Styles", icon: <Palette className="w-4 h-4" /> },
    ],
    PRODUCTION_MANAGER: [
        { path: "/dashboard/production", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { path: "/dashboard/production/orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" /> },
        { path: "/dashboard/production/tech-packs", label: "Tech Packs", icon: <FileText className="w-4 h-4" /> },
        { path: "/dashboard/production/expense-requests", label: "Expense Requests", icon: <Receipt className="w-4 h-4" /> },
    ],
    MERCHANDISER: [
        { path: "/dashboard/merchandiser", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { path: "/dashboard/merchandiser/tech-packs", label: "Tech Packs", icon: <FileText className="w-4 h-4" /> },
    ],
    STORE_MANAGER: [
        { path: "/dashboard/manager", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { path: "/dashboard/manager/requirements", label: "Requirements", icon: <ClipboardList className="w-4 h-4" /> },
        { path: "/dashboard/manager/requests", label: "Material Requests", icon: <Package className="w-4 h-4" /> },
        { path: "/dashboard/manager/expense-requests", label: "Expense Requests", icon: <Receipt className="w-4 h-4" /> },
    ],
    RUNNER: [
        { path: "/dashboard/runner", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { path: "/dashboard/runner/pending", label: "Pending Purchases", icon: <Truck className="w-4 h-4" /> },
        { path: "/dashboard/runner/my-purchases", label: "My Purchases", icon: <ShoppingCart className="w-4 h-4" /> },
    ],
    CEO: [
        { path: "/dashboard/ceo", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
        { path: "/dashboard/ceo/orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" /> },
        { path: "/dashboard/ceo/reports", label: "Reports", icon: <BarChart3 className="w-4 h-4" /> },
    ],
};

const ROLE_LABELS: Record<string, string> = {
    ACCOUNTANT: "Accountant",
    PRODUCTION_MANAGER: "Production Manager",
    MERCHANDISER: "Merchandiser",
    STORE_MANAGER: "Store Manager",
    RUNNER: "Runner",
    CEO: "CEO",
};

export default function DashboardSidebar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!session?.user) return null;

    const role = session.user.role;
    const navItems = NAV_ITEMS[role] || [];

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push("/login");
    };

    return (
        <>
            {/* Mobile header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-gray-200 flex items-center px-4">
                <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900">
                    <Menu className="w-5 h-5" />
                </button>
                <span className="ml-3 text-sm font-semibold text-blue-600">CashFlow</span>
                <div className="ml-auto flex items-center gap-3">
                    <button className="text-gray-400 hover:text-gray-600 relative">
                        <Bell className="w-5 h-5" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <UserIcon className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold text-gray-900 tracking-tight">CashFlow</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Role Badge */}
                <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Portal</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">{ROLE_LABELS[role] || role}</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                                    ? "bg-blue-50 text-blue-700 shadow-sm"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                            >
                                <span className={isActive ? "text-blue-600" : "text-gray-400"}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Footer */}
                <div className="border-t border-gray-200 p-3 shrink-0">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                            {session.user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{session.user.name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{session.user.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
