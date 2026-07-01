"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (next: number) => void;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-brand-primary/30 bg-brand-surface p-0.5">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(value - 1)}
        className={`${dim} grid place-items-center rounded-lg text-brand-primary transition-colors hover:bg-brand-primary/10`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-6 text-center text-sm font-semibold text-ink">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
        className={`${dim} grid place-items-center rounded-lg text-brand-primary transition-colors hover:bg-brand-primary/10`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
