"use client";

import { MapPin, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getLocationPermissionMessage } from "@/lib/hooks/useDeviceLocation";

interface LocationPermissionPromptProps {
  open: boolean;
  role: string;
  denied?: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

export function LocationPermissionPrompt({
  open,
  role,
  denied = false,
  onAllow,
  onDismiss,
}: LocationPermissionPromptProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-4 sm:items-center animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-permission-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-cardHover">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-surface text-brand-primary">
            <MapPin className="h-6 w-6" />
          </span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="grid h-8 w-8 place-items-center rounded-full text-ink-muted hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2
          id="location-permission-title"
          className="text-lg font-bold text-ink"
        >
          {denied ? "Enable location access" : "Allow location access"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {getLocationPermissionMessage(role)}
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-surface px-3 py-2.5 text-xs text-ink-muted">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
          <span>
            Your location is encrypted in transit and only shared with
            authorized users for active deliveries. You can turn off sharing
            anytime from settings.
          </span>
        </div>

        {denied && (
          <p className="mt-3 text-xs text-brand-secondary">
            Permission was denied. Open your browser site settings → Location →
            Allow, then tap Retry.
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <Button fullWidth onClick={onAllow}>
            {denied ? "Retry permission" : "Allow location"}
          </Button>
          {!denied && (
            <Button variant="outline" onClick={onDismiss}>
              Not now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
