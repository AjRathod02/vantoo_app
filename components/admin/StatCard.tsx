import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, trendUp, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-5 shadow-card transition-shadow hover:shadow-cardHover",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-ink-muted">{label}</span>
        <div className="rounded-xl bg-brand-surface p-2">
          <Icon className="h-4 w-4 text-brand-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      {trend && (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            trendUp ? "text-brand-accent" : "text-brand-secondary"
          )}
        >
          {trend}
        </p>
      )}
    </div>
  );
}
