"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search,
  ShoppingCart,
  Users,
  Palette,
  Truck,
  CreditCard,
  Receipt,
  X,
  Loader2,
  ArrowRight,
  Plus,
  LayoutDashboard,
  BarChart3,
  Package,
  ClipboardList,
  ListChecks,
  Clock,
  History,
} from "lucide-react";

interface SearchResult {
  id: string;
  type: "order" | "buyer" | "style" | "vendor" | "purchase" | "expense";
  title: string;
  subtitle: string;
  meta?: string;
}

interface RecentItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  viewedAt: string;
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: typeof Plus;
  iconColor: string;
  href: string;
  section: "action" | "navigation" | "master";
}

const TYPE_CONFIG: Record<
  string,
  { icon: typeof ShoppingCart; label: string; color: string }
> = {
  order: { icon: ShoppingCart, label: "Order", color: "text-blue-400 bg-blue-500/15" },
  buyer: { icon: Users, label: "Buyer", color: "text-emerald-400 bg-emerald-500/15" },
  style: { icon: Palette, label: "Style", color: "text-purple-400 bg-purple-500/15" },
  vendor: { icon: Truck, label: "Vendor", color: "text-orange-400 bg-orange-500/15" },
  purchase: { icon: CreditCard, label: "Purchase", color: "text-cyan-400 bg-cyan-500/15" },
  expense: { icon: Receipt, label: "Expense", color: "text-red-400 bg-red-500/15" },
};

const ROLE_PATHS: Record<string, string> = {
  ACCOUNTANT: "/dashboard/accountant",
  CEO: "/dashboard/ceo",
  PRODUCTION_MANAGER: "/dashboard/production",
  SENIOR_MERCHANDISER: "/dashboard/senior-merchandiser",
  MERCHANDISER: "/dashboard/merchandiser",
  STORE_MANAGER: "/dashboard/manager",
  RUNNER: "/dashboard/runner",
};

function getResultHref(result: SearchResult, role: string): string {
  const base = ROLE_PATHS[role] || "/dashboard";

  switch (result.type) {
    case "order":
      return `${base}/orders/${result.id}`;
    case "buyer":
      return `${base}/buyers`;
    case "style":
      return `${base}/styles`;
    case "vendor":
      return `${base}/vendors`;
    case "purchase":
      if (role === "RUNNER") return `${base}/my-purchases`;
      if (role === "ACCOUNTANT") return `${base}/purchases-review`;
      return base;
    case "expense":
      return `${base}/expense-requests/${result.id}`;
    default:
      return base;
  }
}

function getRecentItemHref(item: RecentItem, role: string): string {
  const base = ROLE_PATHS[role] || "/dashboard";

  switch (item.type) {
    case "order":
      return `${base}/orders/${item.id}`;
    case "purchase":
      if (role === "RUNNER") return `${base}/my-purchases`;
      if (role === "ACCOUNTANT") return `${base}/purchases-review`;
      return base;
    case "expense":
      return `${base}/expense-requests/${item.id}`;
    default:
      return base;
  }
}

function getCommandsForRole(role: string): CommandItem[] {
  const base = ROLE_PATHS[role] || "/dashboard";
  const commands: CommandItem[] = [];

  // --- Quick Actions ---

  if (role === "ACCOUNTANT") {
    commands.push({
      id: "action-create-order",
      label: "Create Order",
      description: "Create a new order",
      icon: Plus,
      iconColor: "text-blue-400 bg-blue-500/15",
      href: `${base}/orders/new`,
      section: "action",
    });
  }

  if (role === "PRODUCTION_MANAGER" || role === "SENIOR_MERCHANDISER") {
    commands.push({
      id: "action-raise-material-need",
      label: "Raise Material Need",
      description: "Create a new material need request",
      icon: Plus,
      iconColor: "text-amber-400 bg-amber-500/15",
      href: `${base}/material-needs`,
      section: "action",
    });
  }

  if (role === "STORE_MANAGER") {
    commands.push({
      id: "action-create-purchase",
      label: "Create Purchase Request",
      description: "Create a new purchase request",
      icon: Plus,
      iconColor: "text-cyan-400 bg-cyan-500/15",
      href: `${base}/requests/new`,
      section: "action",
    });
  }

  if (
    role === "PRODUCTION_MANAGER" ||
    role === "SENIOR_MERCHANDISER" ||
    role === "STORE_MANAGER"
  ) {
    commands.push({
      id: "action-raise-expense",
      label: "Raise Expense",
      description: "Create a new expense request",
      icon: Plus,
      iconColor: "text-red-400 bg-red-500/15",
      href: `${base}/expense-requests`,
      section: "action",
    });
  }

  // --- Navigation ---

  commands.push({
    id: "nav-dashboard",
    label: "Go to Dashboard",
    description: "Open your dashboard",
    icon: LayoutDashboard,
    iconColor: "text-foreground-secondary bg-surface-3",
    href: base,
    section: "navigation",
  });

  if (role === "ACCOUNTANT" || role === "CEO") {
    commands.push({
      id: "nav-reports",
      label: "Go to Reports",
      description: "Open reports",
      icon: BarChart3,
      iconColor: "text-indigo-400 bg-indigo-500/15",
      href: `${base}/reports`,
      section: "navigation",
    });
  }

  commands.push({
    id: "nav-orders",
    label: "Go to Orders",
    description: "View all orders",
    icon: Package,
    iconColor: "text-blue-400 bg-blue-500/15",
    href: `${base}/orders`,
    section: "navigation",
  });

  // Role-specific navigation commands

  if (role === "ACCOUNTANT") {
    commands.push(
      {
        id: "nav-purchases-review",
        label: "Review Purchases",
        description: "Review and approve purchase requests",
        icon: ClipboardList,
        iconColor: "text-cyan-400 bg-cyan-500/15",
        href: `${base}/purchases-review`,
        section: "navigation",
      },
      {
        id: "nav-payments",
        label: "Manage Payments",
        description: "View and manage payments",
        icon: CreditCard,
        iconColor: "text-emerald-400 bg-emerald-500/15",
        href: `${base}/payments`,
        section: "navigation",
      },
      {
        id: "nav-all-transactions",
        label: "All Transactions",
        description: "View all transactions",
        icon: Receipt,
        iconColor: "text-amber-400 bg-amber-500/15",
        href: `${base}/all-transactions`,
        section: "navigation",
      },
      {
        id: "nav-users",
        label: "Manage Users",
        description: "Manage system users",
        icon: Users,
        iconColor: "text-violet-400 bg-violet-500/15",
        href: `${base}/users`,
        section: "navigation",
      }
    );
  }

  if (role === "STORE_MANAGER") {
    commands.push(
      {
        id: "nav-requirements",
        label: "View Requirements",
        description: "View material requirements",
        icon: ListChecks,
        iconColor: "text-amber-400 bg-amber-500/15",
        href: `${base}/requirements`,
        section: "navigation",
      },
      {
        id: "nav-requests",
        label: "View Requests",
        description: "View purchase requests",
        icon: ClipboardList,
        iconColor: "text-cyan-400 bg-cyan-500/15",
        href: `${base}/requests`,
        section: "navigation",
      }
    );
  }

  if (role === "RUNNER") {
    commands.push(
      {
        id: "nav-my-purchases",
        label: "My Purchases",
        description: "View assigned purchases",
        icon: ShoppingCart,
        iconColor: "text-cyan-400 bg-cyan-500/15",
        href: `${base}/my-purchases`,
        section: "navigation",
      },
      {
        id: "nav-pending",
        label: "Pending Tasks",
        description: "View pending tasks",
        icon: Clock,
        iconColor: "text-amber-400 bg-amber-500/15",
        href: `${base}/pending`,
        section: "navigation",
      }
    );
  }

  // --- Master Data (Accountant only) ---

  if (role === "ACCOUNTANT") {
    commands.push(
      {
        id: "master-buyers",
        label: "Manage Buyers",
        description: "View and manage buyers",
        icon: Users,
        iconColor: "text-emerald-400 bg-emerald-500/15",
        href: `${base}/master/buyers`,
        section: "master",
      },
      {
        id: "master-vendors",
        label: "Manage Vendors",
        description: "View and manage vendors",
        icon: Truck,
        iconColor: "text-orange-400 bg-orange-500/15",
        href: `${base}/master/vendors`,
        section: "master",
      },
      {
        id: "master-materials",
        label: "Manage Materials",
        description: "View and manage materials",
        icon: Package,
        iconColor: "text-teal-400 bg-teal-500/15",
        href: `${base}/master/materials`,
        section: "master",
      },
      {
        id: "master-styles",
        label: "Manage Styles",
        description: "View and manage styles",
        icon: Palette,
        iconColor: "text-purple-400 bg-purple-500/15",
        href: `${base}/master/styles`,
        section: "master",
      }
    );
  }

  return commands;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const router = useRouter();
  const { data: session } = useSession();

  const role = session?.user?.role || "";

  const commands = useMemo(() => getCommandsForRole(role), [role]);

  const isCommandMode = query === "" || query.startsWith(">");
  const commandQuery = query.startsWith(">") ? query.slice(1).trim().toLowerCase() : "";

  const filteredCommands = useMemo(() => {
    if (!isCommandMode) return [];
    if (!commandQuery) return commands;
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(commandQuery) ||
        cmd.description.toLowerCase().includes(commandQuery)
    );
  }, [isCommandMode, commandQuery, commands]);

  const actionCommands = useMemo(
    () => filteredCommands.filter((c) => c.section === "action"),
    [filteredCommands]
  );
  const navigationCommands = useMemo(
    () => filteredCommands.filter((c) => c.section === "navigation"),
    [filteredCommands]
  );
  const masterCommands = useMemo(
    () => filteredCommands.filter((c) => c.section === "master"),
    [filteredCommands]
  );

  // Show recent items when palette opens with empty query and no command query
  const showRecent = isCommandMode && !commandQuery && recentItems.length > 0;

  const totalItems = isCommandMode
    ? filteredCommands.length + (showRecent ? recentItems.length : 0)
    : results.length;

  // Fetch recent items when palette opens
  useEffect(() => {
    if (open) {
      setRecentLoading(true);
      fetch("/api/recent-items")
        .then((res) => res.json())
        .then((data) => {
          setRecentItems((data.items || []).slice(0, 5));
        })
        .catch(() => {
          setRecentItems([]);
        })
        .finally(() => {
          setRecentLoading(false);
        });
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  const doSearch = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
          const data = await res.json();
          setResults(data.results || []);
          setActiveIndex(0);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, 250);
    },
    []
  );

  const handleInputChange = (val: string) => {
    setQuery(val);
    setActiveIndex(0);
    if (!val.startsWith(">") && val.length >= 2) {
      doSearch(val);
    } else if (!val.startsWith(">")) {
      setResults([]);
      setLoading(false);
    }
  };

  const navigateTo = (result: SearchResult) => {
    const href = getResultHref(result, role);
    setOpen(false);
    router.push(href);
  };

  const navigateToRecentItem = (item: RecentItem) => {
    const href = getRecentItemHref(item, role);
    setOpen(false);
    router.push(href);
  };

  const navigateToCommand = (cmd: CommandItem) => {
    setOpen(false);
    router.push(cmd.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, totalItems - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isCommandMode) {
        // Recent items come after commands in the flat index
        if (showRecent && activeIndex >= filteredCommands.length) {
          const recentIdx = activeIndex - filteredCommands.length;
          if (recentItems[recentIdx]) {
            navigateToRecentItem(recentItems[recentIdx]);
          }
        } else if (filteredCommands[activeIndex]) {
          navigateToCommand(filteredCommands[activeIndex]);
        }
      } else if (!isCommandMode && results[activeIndex]) {
        navigateTo(results[activeIndex]);
      }
    }
  };

  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll("[data-command-item]");
      const activeEl = items[activeIndex] as HTMLElement;
      activeEl?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  if (!open) return null;

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  let flatIndex = 0;
  let commandFlatIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        <div className="w-full max-w-xl bg-surface-2 rounded-xl shadow-premium-xl border border-border overflow-hidden animate-fade-in">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border-secondary">
            <Search className="w-4 h-4 text-foreground-tertiary shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Search or type ">" for commands...'
              className="flex-1 text-sm text-foreground placeholder:text-foreground-muted outline-none bg-transparent"
            />
            {(loading || recentLoading) && <Loader2 className="w-4 h-4 text-foreground-tertiary animate-spin shrink-0" />}
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-foreground-muted hover:text-foreground-secondary rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Area */}
          <div ref={listRef} className="max-h-[360px] overflow-y-auto">
            {isCommandMode ? (
              filteredCommands.length === 0 && !showRecent ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-foreground-muted">
                    No matching commands
                  </p>
                </div>
              ) : (
                <>
                  {actionCommands.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 bg-surface-3 border-b border-border-secondary">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                          Quick Actions
                        </span>
                      </div>
                      {actionCommands.map((cmd) => {
                        const idx = commandFlatIndex++;
                        const Icon = cmd.icon;
                        return (
                          <button
                            key={cmd.id}
                            data-command-item
                            onClick={() => navigateToCommand(cmd)}
                            className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                              idx === activeIndex
                                ? "bg-brand-muted"
                                : "hover:bg-surface-3"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cmd.iconColor}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {cmd.label}
                              </p>
                              <p className="text-xs text-foreground-tertiary truncate">
                                {cmd.description}
                              </p>
                            </div>
                            <ArrowRight
                              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                idx === activeIndex
                                  ? "text-brand-hover"
                                  : "text-foreground-muted"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {navigationCommands.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 bg-surface-3 border-b border-border-secondary">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                          Navigation
                        </span>
                      </div>
                      {navigationCommands.map((cmd) => {
                        const idx = commandFlatIndex++;
                        const Icon = cmd.icon;
                        return (
                          <button
                            key={cmd.id}
                            data-command-item
                            onClick={() => navigateToCommand(cmd)}
                            className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                              idx === activeIndex
                                ? "bg-brand-muted"
                                : "hover:bg-surface-3"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cmd.iconColor}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {cmd.label}
                              </p>
                              <p className="text-xs text-foreground-tertiary truncate">
                                {cmd.description}
                              </p>
                            </div>
                            <ArrowRight
                              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                idx === activeIndex
                                  ? "text-brand-hover"
                                  : "text-foreground-muted"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {masterCommands.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 bg-surface-3 border-b border-border-secondary">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                          Master Data
                        </span>
                      </div>
                      {masterCommands.map((cmd) => {
                        const idx = commandFlatIndex++;
                        const Icon = cmd.icon;
                        return (
                          <button
                            key={cmd.id}
                            data-command-item
                            onClick={() => navigateToCommand(cmd)}
                            className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                              idx === activeIndex
                                ? "bg-brand-muted"
                                : "hover:bg-surface-3"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cmd.iconColor}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {cmd.label}
                              </p>
                              <p className="text-xs text-foreground-tertiary truncate">
                                {cmd.description}
                              </p>
                            </div>
                            <ArrowRight
                              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                idx === activeIndex
                                  ? "text-brand-hover"
                                  : "text-foreground-muted"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {showRecent && (
                    <div>
                      <div className="px-4 py-1.5 bg-surface-3 border-b border-border-secondary">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                          Recent
                        </span>
                      </div>
                      {recentItems.map((item, i) => {
                        const idx = filteredCommands.length + i;
                        const config = TYPE_CONFIG[item.type];
                        const Icon = config?.icon || History;
                        const color = config?.color || "text-foreground-secondary bg-surface-3";
                        return (
                          <button
                            key={`recent-${item.id}-${item.type}`}
                            data-command-item
                            onClick={() => navigateToRecentItem(item)}
                            className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                              idx === activeIndex
                                ? "bg-brand-muted"
                                : "hover:bg-surface-3"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {item.title}
                              </p>
                              <p className="text-xs text-foreground-tertiary truncate">
                                {item.subtitle}
                              </p>
                            </div>
                            <History className="w-3 h-3 text-foreground-muted shrink-0" />
                            <ArrowRight
                              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                idx === activeIndex
                                  ? "text-brand-hover"
                                  : "text-foreground-muted"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )
            ) : !loading && query.length >= 2 && results.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-foreground-muted">
                  No results for &quot;{query}&quot;
                </p>
              </div>
            ) : query.length < 2 && query.length > 0 ? (
              <div className="px-4 py-10 text-center">
                <Search className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
                <p className="text-sm text-foreground-muted">
                  Type at least 2 characters to search
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([type, items]) => {
                const config = TYPE_CONFIG[type];
                return (
                  <div key={type}>
                    <div className="px-4 py-1.5 bg-surface-3 border-b border-border-secondary">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                        {config?.label || type}
                      </span>
                    </div>
                    {items.map((result) => {
                      const idx = flatIndex++;
                      const Icon = config?.icon || ShoppingCart;
                      return (
                        <button
                          key={result.id}
                          data-command-item
                          onClick={() => navigateTo(result)}
                          className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${
                            idx === activeIndex
                              ? "bg-brand-muted"
                              : "hover:bg-surface-3"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config?.color}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-foreground-tertiary truncate">
                              {result.subtitle}
                            </p>
                          </div>
                          {result.meta && (
                            <span className="text-xs text-foreground-muted shrink-0">
                              {result.meta}
                            </span>
                          )}
                          <ArrowRight
                            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                              idx === activeIndex
                                ? "text-brand-hover"
                                : "text-foreground-muted"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-border-secondary bg-surface-3 text-[11px] text-foreground-muted">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-1 border border-border rounded text-[10px] font-mono">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-1 border border-border rounded text-[10px] font-mono">
                ↵
              </kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-1 border border-border rounded text-[10px] font-mono">
                esc
              </kbd>
              Close
            </span>
            <span className="ml-auto flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-1 border border-border rounded text-[10px] font-mono">
                &gt;
              </kbd>
              Commands
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
