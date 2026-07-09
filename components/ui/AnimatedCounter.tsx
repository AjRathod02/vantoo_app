"use client";

import { memo } from "react";
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
  animate?: boolean;
  "aria-label"?: string;
}

export const AnimatedCounter = memo(function AnimatedCounter({
  value,
  format = String,
  className,
  animate = true,
  "aria-label": ariaLabel,
}: AnimatedCounterProps) {
  const display = useAnimatedNumber(value, 450, animate);

  return (
    <span className={cn("tabular-nums", className)} aria-label={ariaLabel}>
      {format(display)}
    </span>
  );
});
