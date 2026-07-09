"use client";

import { useState } from "react";
import { ChevronDown, MapPin, Navigation } from "lucide-react";
import { useResolvedCity } from "@/lib/hooks/useResolvedCity";
import { useLocationStore } from "@/lib/stores/location";
import { cn } from "@/lib/utils";

export function LocationCityButton({ className }: { className?: string }) {
  const { city, area, hasGps } = useResolvedCity();
  const permission = useLocationStore((s) => s.permission);
  const setSharingEnabled = useLocationStore((s) => s.setSharingEnabled);
  const [open, setOpen] = useState(false);

  const displayText = area ? `${area}, ${city}` : city;

  const enableLocation = () => {
    setSharingEnabled(true);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex max-w-[180px] items-center gap-1 rounded-xl px-2 py-1.5 text-sm text-ink-muted hover:bg-gray-50 sm:max-w-[220px]",
          className
        )}
        aria-label="Change delivery location"
      >
        <MapPin className="h-4 w-4 shrink-0 text-brand-primary" />
        <span className="truncate font-medium text-ink">{displayText}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-surface text-brand-primary">
                <MapPin className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-ink">Delivery location</h3>
                <p className="text-sm text-ink-muted">
                  {hasGps
                    ? "Using your current location"
                    : "Enable location for accurate delivery"}
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Current city
              </p>
              <p className="mt-1 text-lg font-bold text-ink">{city}</p>
              {area && (
                <p className="text-sm text-ink-muted">{area}</p>
              )}
            </div>

            {permission !== "granted" && (
              <button
                type="button"
                onClick={enableLocation}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white"
              >
                <Navigation className="h-4 w-4" />
                Use my current location
              </button>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-ink hover:bg-gray-50"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
