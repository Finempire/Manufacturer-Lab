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
  FileText,
  LayoutDashboard,
  BarChart3,
  Package,
} from "lucide-react";

interface SearchResult {
  id: string;
  type: "order" | "buyer" | "style" | "vendor" | "purchase" | "expense";
  title: string;
  subtitle: string;
  meta?: string;
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: typeof Plus;
  iconColor: string;
  href: string;
  section: "action" | "navigation";
}

const TYPE_CONFIG: Record<
  string,
  { icon: typeof ShoppingCart; label: string; color: string }
> = {
  order: { icon: ShoppingCart, label: "Order", color: "text-blue-600 bg-blue-50" },
  buyer: { icon: Users, label: "Buyer", color: "text-emerald-600 bg-emerald-50" },
  style: { icon: Palette, label: "Style", color: "text-purple-600 bg-purple-50" },
  vendor: { icon: Truck, label: "Vendor", color: "text-orange-600 bg-orange-50" },
  purchase: { icon: CreditCard, label: "Purchase", color: "text-cyan-600 bg-cyan-50" },
  expense: { icon: Receipt, label: "Expense", color: "text-red-600 bg-red-50" },
};

const ROLE_PATHS: Record<string, string> = {
  ACCOUNTANT: "/dashboard/accountant",
  CEO: "/dashboard/ceo",
  PRODUCTION_MANAGER: "/dashboard/production",
  SAMPLE_PRODUCTION_MANAGER: "/dashboard/sample-pm",
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

function getCommandsForRole(role: string): CommandItem[] {
  const base = ROLE_PATHS[role] || "/dashboard";
  const commands: CommandItem[] = [];

  // Quick Actions (role-aware)
  if (role === "ACCOUNTANT") {
    commands.push({
      id: "action-create-order",
      label: "Create Order",
      description: "Create a new order",
      icon: Plus,
      iconColor: "text-blue-600 bg-blue-50",
      href: `${base}/orders/new`,
      section: "action",
    });
  }

  if (role === "PRODUCTION_MANAGER" || role === "SAMPLE_PRODUCTION_MANAGER") {
    commands.push({
      id: "action-raise-material-need",
      label: "Raise Material Need",
      description: "Create a new material need request",
      icon: Plus,
      iconColor: "text-amber-600 bg-amber-50",
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
      iconColor: "text-cyan-600 bg-cyan-50",
      href: `${base}/requests/new`,
      section: "action",
    });
  }

  if (
    role === "PRODUCTION_MANAGER" ||
    role === "SAMPLE_PRODUCTION_MANAGER" ||
    role === "STORE_MANAGER"
  ) {
    commands.push({
      id: "action-raise-expense",
      label: "Raise Expense",
      description: "Create a new expense request",
      icon: Plus,
      iconColor: "text-red-600 bg-red-50",
      href: `${base}/expense-requests`,
      section: "action",
    });
  }

  // Navigation Commands (all roles)
  commands.push({
    id: "nav-dashboard",
    label: "Go to Dashboard",
    description: "Open your dashboard",
    icon: LayoutDashboard,
    iconColor: "text-slate-600 bg-slate-100",
    href: base,
    section: "navigation",
  });

  if (role === "ACCOUNTANT" || role === "CEO") {
    commands.push({
      id: "nav-reports",
      label: "Go to Reports",
      description: "Open reports",
      icon: BarChart3,
      iconColor: "text-indigo-600 bg-indigo-50",
      href: `${base}/reports`,
      section: "navigation",
    });
  }

  commands.push({
    id: "nav-orders",
    label: "Go to Orders",
    description: "View all orders",
    icon: Package,
    iconColor: "text-blue-600 bg-blue-50",
    href: `${base}/orders`,
    section: "navigation",
  });

  if (
    role === "PRODUCTION_MANAGER" ||
    role === "SAMPLE_PRODUCTION_MANAGER" ||
    role === "MERCHANDISER"
  ) {
    commands.push({
      id: "nav-techpacks",
      label: "Go to Tech Packs",
      description: "View tech packs",
      icon: FileText,
      iconColor: "text-purple-600 bg-purple-50",
      href: `${base}/tech-packs`,
      section: "navigation",
    });
  }

  return commands;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const router = useRouter();
  const { data: session } = useSession();

  const role = session?.user?.role || "";

  const commands = useMemo(() => getCommandsForRole(role), [role]);

  // Determine if we should show commands vs search results
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

  // Total navigable items count for keyboard navigation
  const totalItems = isCommandMode ? filteredCommands.length : results.length;

  // Ctrl+K to open
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

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  // Debounced search
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
    // Only trigger search for non-command queries with 2+ chars
    if (!val.startsWith(">") && val.length >= 2) {
      doSearch(val);
    } else if (!val.startsWith(">")) {
      // Clear search results when below threshold
      setResults([]);
      setLoading(false);
    }
  };

  const navigateTo = (result: SearchResult) => {
    const href = getResultHref(result, role);
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
      if (isCommandMode && filteredCommands[activeIndex]) {
        navigateToCommand(filteredCommands[activeIndex]);
      } else if (!isCommandMode && results[activeIndex]) {
        navigateTo(results[activeIndex]);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll("[data-command-item]");
      const activeEl = items[activeIndex] as HTMLElement;
      activeEl?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  if (!open) return null;

  // Group search results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  // Flatten for keyboard navigation index (search results only)
  let flatIndex = 0;

  // Track command flat index for keyboard navigation
  let commandFlatIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Search or type ">" for commands...'
              className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
            />
            {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />}
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Area */}
          <div ref={listRef} className="max-h-[360px] overflow-y-auto">
            {isCommandMode ? (
              /* Command Mode: show quick actions and navigation */
              filteredCommands.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-slate-400">
                    No matching commands
                  </p>
                </div>
              ) : (
                <>
                  {/* Quick Actions Section */}
                  {actionCommands.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
                                ? "bg-blue-50"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cmd.iconColor}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {cmd.label}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {cmd.description}
                              </p>
                            </div>
                            <ArrowRight
                              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                idx === activeIndex
                                  ? "text-blue-400"
                                  : "text-slate-300"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Navigation Section */}
                  {navigationCommands.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
                                ? "bg-blue-50"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cmd.iconColor}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {cmd.label}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {cmd.description}
                              </p>
                            </div>
                            <ArrowRight
                              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                idx === activeIndex
                                  ? "text-blue-400"
                                  : "text-slate-300"
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
              /* Search mode: no results */
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-slate-400">
                  No results for &quot;{query}&quot;
                </p>
              </div>
            ) : query.length < 2 && query.length > 0 ? (
              /* Search mode: too short */
              <div className="px-4 py-10 text-center">
                <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">
                  Type at least 2 characters to search
                </p>
              </div>
            ) : (
              /* Search mode: show grouped results */
              Object.entries(grouped).map(([type, items]) => {
                const config = TYPE_CONFIG[type];
                return (
                  <div key={type}>
                    {/* Section Header */}
                    <div className="px-4 py-1.5 bg-slate-50 border-b border-slate-100">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {config?.label || type}
                      </span>
                    </div>
                    {/* Items */}
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
                              ? "bg-blue-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config?.color}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {result.subtitle}
                            </p>
                          </div>
                          {result.meta && (
                            <span className="text-xs text-slate-400 shrink-0">
                              {result.meta}
                            </span>
                          )}
                          <ArrowRight
                            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                              idx === activeIndex
                                ? "text-blue-400"
                                : "text-slate-300"
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
          <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                ↵
              </kbd>
              Open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
                esc
              </kbd>
              Close
            </span>
            <span className="ml-auto flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono">
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
