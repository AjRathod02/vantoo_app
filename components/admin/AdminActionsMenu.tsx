"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminActionItem = {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger" | "success";
  disabled?: boolean;
  divider?: boolean;
};

interface AdminActionsMenuProps {
  items: AdminActionItem[];
  align?: "left" | "right";
  label?: string;
}

export function AdminActionsMenu({
  items,
  align = "right",
  label = "Actions",
}: AdminActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-ink-muted hover:bg-gray-50 hover:text-ink"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          className={cn(
            "absolute z-30 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="my-1 border-t border-gray-100" />
            ) : (
              <button
                key={item.label + i}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={cn(
                  "block w-full px-3 py-2 text-left text-sm transition-colors disabled:opacity-40",
                  item.tone === "danger" && "text-brand-secondary hover:bg-red-50",
                  item.tone === "success" && "text-green-700 hover:bg-green-50",
                  (!item.tone || item.tone === "default") && "text-ink hover:bg-gray-50"
                )}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
