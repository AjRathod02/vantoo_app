"use client";

import { cn } from "@/lib/utils";

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand-primary bg-brand-primary text-white"
          : "border-gray-300 bg-white text-ink-muted hover:border-brand-primary hover:text-brand-primary"
      )}
    >
      {children}
    </button>
  );
}
