"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

interface AdminFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: () => void;
  placeholder?: string;
  filters?: {
    key: string;
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  sort?: {
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  };
  rightSlot?: React.ReactNode;
  className?: string;
}

export function AdminFilterBar({
  search,
  onSearchChange,
  onSearchSubmit,
  placeholder = "Search…",
  filters = [],
  sort,
  rightSlot,
  className,
}: AdminFilterBarProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit?.();
        }}
      >
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-soft focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>
        {sort && (
          <select
            value={sort.value}
            onChange={(e) => sort.onChange(e.target.value)}
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-ink"
            aria-label="Sort"
          >
            {sort.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        {onSearchSubmit && (
          <Button type="submit" size="md">
            Search
          </Button>
        )}
        {rightSlot}
      </form>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {filters.map((f) => (
            <div key={f.key} className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                {f.label}
              </span>
              {f.options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => f.onChange(o.value)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                    f.value === o.value
                      ? "bg-brand-primary text-white"
                      : "bg-gray-100 text-ink-muted hover:bg-gray-200"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
