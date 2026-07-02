import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function AvailabilityBadge({
  inStock,
  className,
  size = "sm",
}: {
  inStock: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const iconClass = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  const textClass = size === "md" ? "text-sm" : "text-xs";

  if (inStock) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-medium text-green-600",
          textClass,
          className
        )}
      >
        <CheckCircle2 className={iconClass} />
        Available
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium text-ink-soft",
        textClass,
        className
      )}
    >
      <XCircle className={iconClass} />
      Out of Stock
    </span>
  );
}
