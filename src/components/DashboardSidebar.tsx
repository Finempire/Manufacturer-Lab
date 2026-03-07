"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  LogOut, Menu, Bell, X, ChevronDown,
  LayoutDashboard, ShoppingCart, CreditCard, FileText,
  Package, Users, Boxes, ClipboardList, Truck,
  BarChart3, Receipt, Palette, Store, Factory,
  BookOpen, AlertCircle
} from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

const NAV_ITEMS: Record<string, NavItem[]> = {
  ACCOUNTANT: [
    { path: "/dashboard/accountant", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/accountant/orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/accountant/purchases-review", label: "Purchases Review", icon: <ClipboardList className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/accountant/payments", label: "Payments", icon: <CreditCard className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/accountant/expense-requests", label: "Expense Requests", icon: <Receipt className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/accountant/material-needs", label: "Material Needs", icon: <Package className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/accountant/reports", label: "Reports", icon: <BarChart3 className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/accountant/master/vendors", label: "Vendors", icon: <Store className="w-4 h-4" />, section: "Master Data" },
    { path: "/dashboard/accountant/master/buyers", label: "Buyers", icon: <Users className="w-4 h-4" />, section: "Master Data" },
    { path: "/dashboard/accountant/master/materials", label: "Materials", icon: <Boxes className="w-4 h-4" />, section: "Master Data" },
    { path: "/dashboard/accountant/master/styles", label: "Styles", icon: <Palette className="w-4 h-4" />, section: "Master Data" },
    { path: "/dashboard/accountant/users", label: "Users", icon: <Users className="w-4 h-4" />, section: "Administration" },
  ],
  SAMPLE_PRODUCTION_MANAGER: [
    { path: "/dashboard/sample-pm", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/sample-pm/orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/sample-pm/tech-packs", label: "Tech Packs", icon: <FileText className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/sample-pm/material-needs", label: "Material Needs", icon: <Package className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/sample-pm/production", label: "Production", icon: <Factory className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/sample-pm/expense-requests", label: "Expense Requests", icon: <Receipt className="w-4 h-4" />, section: "Main" },
  ],
  PRODUCTION_MANAGER: [
    { path: "/dashboard/production", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/production/orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/production/tech-packs", label: "Tech Packs", icon: <FileText className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/production/material-needs", label: "Material Needs", icon: <Package className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/production/production", label: "Production", icon: <Factory className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/production/expense-requests", label: "Expense Requests", icon: <Receipt className="w-4 h-4" />, section: "Main" },
  ],
  MERCHANDISER: [
    { path: "/dashboard/merchandiser", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/merchandiser/tech-packs", label: "Tech Packs", icon: <FileText className="w-4 h-4" />, section: "Main" },
  ],
  STORE_MANAGER: [
    { path: "/dashboard/manager", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/manager/requirements", label: "Requirements", icon: <ClipboardList className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/manager/requests", label: "Material Requests", icon: <Package className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/manager/expense-requests", label: "Expense Requests", icon: <Receipt className="w-4 h-4" />, section: "Main" },
  ],
  RUNNER: [
    { path: "/dashboard/runner", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/runner/pending", label: "Pending", icon: <AlertCircle className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/runner/my-purchases", label: "My Purchases", icon: <Truck className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/runner/notifications", label: "Notifications", icon: <Bell className="w-4 h-4" />, section: "Main" },
  ],
  CEO: [
    { path: "/dashboard/ceo", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/ceo/orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/ceo/transactions", label: "Transactions", icon: <CreditCard className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/ceo/expense-requests", label: "Expense Requests", icon: <Receipt className="w-4 h-4" />, section: "Main" },
    { path: "/dashboard/ceo/reports", label: "Reports", icon: <BarChart3 className="w-4 h-4" />, section: "Main" },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  ACCOUNTANT: "Accountant",
  SAMPLE_PRODUCTION_MANAGER: "Sample PM",
  PRODUCTION_MANAGER: "Production PM",
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications?unread=true");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch {
        // silent fail
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!session?.user) return null;

  const role = session.user.role;
  const navItems = NAV_ITEMS[role] || [];

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Group nav items by section
  const sections: Record<string, NavItem[]> = {};
  navItems.forEach(item => {
    const section = item.section || "Main";
    if (!sections[section]) sections[section] = [];
    sections[section].push(item);
  });

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200/80 shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <span className="text-base font-bold text-gray-900 tracking-tight">CashFlow</span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Badge */}
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{ROLE_LABELS[role] || role}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {Object.entries(sections).map(([sectionName, items]) => (
          <div key={sectionName} className="mb-1">
            {sectionName !== "Main" && (
              <button
                onClick={() => toggleSection(sectionName)}
                className="w-full flex items-center justify-between px-4 py-1.5 mt-2"
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{sectionName}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${collapsedSections[sectionName] ? '-rotate-90' : ''}`} />
              </button>
            )}
            {!collapsedSections[sectionName] && (
              <div className="px-2 space-y-0.5">
                {items.map((item) => {
                  const isActive = pathname === item.path ||
                    (item.path !== navItems[0]?.path && pathname.startsWith(item.path + "/"));
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                          : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                      }`}
                    >
                      <span className={`shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`}>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="border-t border-gray-200 p-3 shrink-0 bg-white">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-semibold shadow-sm shrink-0">
            {session.user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate leading-tight">{session.user.name}</p>
            <p className="text-[11px] text-gray-400 truncate">{session.user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center px-4 shadow-sm">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900">
          <Menu className="w-5 h-5" />
        </button>
        <span className="ml-3 text-sm font-bold text-gray-900">CashFlow</span>
        <div className="ml-auto flex items-center gap-2">
          <button className="text-gray-400 hover:text-gray-600 relative p-1">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200/80 flex flex-col transition-transform duration-200 ease-in-out md:relative md:translate-x-0 shadow-lg md:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
