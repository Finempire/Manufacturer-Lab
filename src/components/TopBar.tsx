"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, ChevronRight, LogOut, User } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

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

export default function TopBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!session?.user) return null;

  const role = session.user.role;
  const breadcrumbs = getBreadcrumbs(pathname, role);

  return (
    <header className="hidden md:flex h-12 shrink-0 items-center justify-between px-6 bg-surface-1 border-b border-border-secondary sticky top-0 z-30">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-foreground-muted" />}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-foreground-tertiary hover:text-foreground-secondary transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Search Trigger */}
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground-tertiary bg-surface-2 border border-border rounded-lg hover:border-border-accent hover:text-foreground-secondary transition-all"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Search...</span>
          <kbd className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 bg-surface-3 border border-border rounded text-foreground-muted">Ctrl+K</kbd>
        </button>

        {/* Notification Center */}
        <NotificationCenter />

        {/* User Avatar */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); }}
            className="w-8 h-8 rounded-full bg-surface-3 text-foreground-secondary flex items-center justify-center text-xs font-semibold hover:bg-border-accent transition-colors"
          >
            {session.user.name?.charAt(0).toUpperCase()}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-2 border border-border rounded-lg shadow-premium-lg overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-border-secondary">
                <p className="text-sm font-medium text-foreground">{session.user.name}</p>
                <p className="text-xs text-foreground-tertiary">{session.user.email}</p>
              </div>
              <div className="py-1">
                <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-secondary hover:bg-surface-3 transition-colors">
                  <User className="w-4 h-4 text-foreground-tertiary" /> Profile
                </button>
                <button
                  onClick={async () => { await signOut({ redirect: false }); router.push("/login"); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground-secondary hover:bg-surface-3 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-foreground-tertiary" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
