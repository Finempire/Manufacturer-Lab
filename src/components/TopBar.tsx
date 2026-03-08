"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Search, ChevronRight, LogOut, User } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  entity_type?: string;
}

const ROLE_DASHBOARDS: Record<string, string> = {
  ACCOUNTANT: "/dashboard/accountant",
  CEO: "/dashboard/ceo",
  PRODUCTION_MANAGER: "/dashboard/production",
  SAMPLE_PRODUCTION_MANAGER: "/dashboard/sample-pm",
  MERCHANDISER: "/dashboard/merchandiser",
  STORE_MANAGER: "/dashboard/manager",
  RUNNER: "/dashboard/runner",
};

function getBreadcrumbs(pathname: string, role: string) {
  const base = ROLE_DASHBOARDS[role] || "/dashboard";
  const relative = pathname.replace(base, "").replace(/^\//, "");
  if (!relative) return [{ label: "Dashboard", href: base }];

  const parts = relative.split("/").filter(Boolean);
  const crumbs = [{ label: "Dashboard", href: base }];

  let currentPath = base;
  for (const part of parts) {
    currentPath += `/${part}`;
    // Skip UUID segments
    if (/^[0-9a-f-]{36}$/.test(part)) continue;
    const label = part
      .replace(/-/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());
    crumbs.push({ label, href: currentPath });
  }

  return crumbs;
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TopBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const [countRes, listRes] = await Promise.all([
          fetch("/api/notifications?unread=true"),
          fetch("/api/notifications?limit=10"),
        ]);
        if (countRes.ok) {
          const data = await countRes.json();
          setUnreadCount(data.count || 0);
        }
        if (listRes.ok) {
          const data = await listRes.json();
          setNotifications(Array.isArray(data) ? data.slice(0, 10) : data.notifications?.slice(0, 10) || []);
        }
      } catch { /* silent */ }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close popovers on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!session?.user) return null;

  const role = session.user.role;
  const breadcrumbs = getBreadcrumbs(pathname, role);

  return (
    <header className="hidden md:flex h-12 shrink-0 items-center justify-between px-6 bg-white border-b border-slate-200 sticky top-0 z-30">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-slate-900">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-slate-500 hover:text-slate-700">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Search Trigger */}
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 hover:text-slate-500 transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Search...</span>
          <kbd className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-400">Ctrl+K</kbd>
        </button>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
            className="relative p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              </div>
              <div className="overflow-y-auto max-h-[400px]">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${
                        !n.is_read ? "bg-blue-50/50 border-l-2 border-l-blue-400" : ""
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{n.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                <button onClick={() => { setShowNotifs(false); }} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
            className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-semibold hover:bg-slate-300 transition-colors"
          >
            {session.user.name?.charAt(0).toUpperCase()}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900">{session.user.name}</p>
                <p className="text-xs text-slate-400">{session.user.email}</p>
              </div>
              <div className="py-1">
                <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <User className="w-4 h-4 text-slate-400" /> Profile
                </button>
                <button
                  onClick={async () => { await signOut({ redirect: false }); router.push("/login"); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="w-4 h-4 text-slate-400" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
