"use client";

import { MapPin } from "lucide-react";
import { useResolvedCity } from "@/lib/hooks/useResolvedCity";
import { useLocationPermission } from "@/lib/hooks/useDeviceLocation";
import { useLocationStore } from "@/lib/stores/location";
import { cn } from "@/lib/utils";

export function LocationCityButton({ className }: { className?: string }) {
  const { city, area } = useResolvedCity();
  const permission = useLocationStore((s) => s.permission);
  const setSharingEnabled = useLocationStore((s) => s.setSharingEnabled);
  const { requestPermission } = useLocationPermission();

  const displayText = area ? `${area}, ${city}` : city;
  const needsPermission = permission === "prompt" || permission === "denied";

  const requestAccess = async (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (!needsPermission) return;
    const ok = await requestPermission();
    if (ok) setSharingEnabled(true);
  };

  return (
    <div
      role={needsPermission ? "button" : "status"}
      tabIndex={needsPermission ? 0 : undefined}
      onClick={needsPermission ? requestAccess : undefined}
      onKeyDown={
        needsPermission
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                void requestAccess(e);
              }
            }
          : undefined
      }
      className={cn(
        "flex max-w-[180px] shrink-0 items-center gap-1 rounded-xl px-2 py-1.5 text-sm text-ink-muted sm:max-w-[220px]",
        needsPermission && "cursor-pointer hover:bg-gray-50",
        className
      )}
      aria-label={
        needsPermission
          ? "Enable delivery location"
          : `Delivery location: ${displayText}`
      }
    >
      <MapPin className="h-4 w-4 shrink-0 text-brand-primary" />
      <span className="truncate font-medium text-ink">{displayText}</span>
    </div>
  );
}
