"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: "md" | "lg" | "xl";
}

const widthClasses = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function DetailDrawer({ open, onClose, title, subtitle, children, width = "lg" }: DetailDrawerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full ${widthClasses[width]} w-full bg-surface-2 border-l border-border shadow-premium-xl z-50 flex flex-col animate-slide-in-right`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border-secondary">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground truncate">{title}</h2>
            {subtitle && <p className="text-sm text-foreground-tertiary mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1.5 rounded-lg text-foreground-muted hover:text-foreground-secondary hover:bg-surface-3 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </>
  );
}

interface DrawerSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function DrawerSection({ title, children, defaultOpen = true }: DrawerSectionProps) {
  return (
    <div className={`${defaultOpen ? "" : ""}  mb-4`}>
      <h3 className="text-xs font-semibold text-foreground-tertiary uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  );
}

interface DrawerFieldProps {
  label: string;
  value: React.ReactNode;
}

export function DrawerField({ label, value }: DrawerFieldProps) {
  return (
    <div className="flex justify-between py-1.5 text-sm border-b border-border-secondary last:border-0">
      <span className="text-foreground-tertiary">{label}</span>
      <span className="text-foreground font-medium text-right max-w-[60%] truncate">{value || "—"}</span>
    </div>
  );
}
