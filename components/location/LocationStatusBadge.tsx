"use client";

import { memo } from "react";
import { MapPin, Wifi, WifiOff } from "lucide-react";
import { useLocationStore } from "@/lib/stores/location";
import { cn } from "@/lib/utils";

export const LocationStatusBadge = memo(function LocationStatusBadge({
  className,
}: {
  className?: string;
}) {
  const { permission, sharingEnabled, position, error } = useLocationStore();

  if (permission === "unsupported") return null;

  const live = sharingEnabled && permission === "granted" && position;
  const label = error
    ? "Location issue"
    : live
      ? "Live GPS"
      : permission === "denied"
        ? "Location off"
        : "Locating…";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        live
          ? "bg-brand-accent/15 text-brand-accent"
          : error || permission === "denied"
            ? "bg-brand-secondary/10 text-brand-secondary"
            : "bg-gray-100 text-ink-muted",
        className
      )}
      title={error ?? undefined}
    >
      {live ? (
        <Wifi className="h-3.5 w-3.5" />
      ) : permission === "denied" ? (
        <WifiOff className="h-3.5 w-3.5" />
      ) : (
        <MapPin className="h-3.5 w-3.5" />
      )}
      {label}
    </span>
  );
});
