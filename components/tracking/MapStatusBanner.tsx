"use client";

import { memo } from "react";
import type { OrderStatus } from "@/lib/types";
import { getMapTrackingPhase, mapPhaseMeta } from "@/lib/orderStatus";
import { cn } from "@/lib/utils";

export const MapStatusBanner = memo(function MapStatusBanner({
  status,
  distanceRemainingM,
  etaMinutes,
  className,
}: {
  status: OrderStatus;
  distanceRemainingM?: number;
  etaMinutes?: number;
  className?: string;
}) {
  const phase = getMapTrackingPhase(status);
  const meta = mapPhaseMeta[phase];

  return (
    <div
      className={cn(
        "absolute left-4 right-4 top-4 z-10 rounded-2xl border border-white/30 bg-white/90 px-4 py-3 shadow-card backdrop-blur-md dark:border-white/10 dark:bg-ink/80 dark:text-white",
        className
      )}
    >
      <p className="text-sm font-bold text-ink dark:text-white">{meta.title}</p>
      <p className="text-xs text-ink-muted dark:text-white/70">
        {phase === "near" && distanceRemainingM != null
          ? `🛵 ${distanceRemainingM >= 1000 ? `${(distanceRemainingM / 1000).toFixed(1)} km` : `${distanceRemainingM}m`} away · Arriving in ${etaMinutes ?? "—"} mins`
          : meta.subtitle}
      </p>
    </div>
  );
});
