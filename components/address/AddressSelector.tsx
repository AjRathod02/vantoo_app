"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  Check,
  Home,
  MapPin,
  Navigation,
  Plus,
} from "lucide-react";
import type { Address } from "@/lib/types";
import { ADDRESS_LABELS, type AddressLabelId } from "@/lib/address/labels";
import { reverseGeocode } from "@/lib/location/reverseGeocode";
import { useLocationStore } from "@/lib/stores/location";
import { useAuthStore } from "@/lib/stores/auth";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export type AddressForm = {
  label: AddressLabelId;
  fullName: string;
  phone: string;
  pincode: string;
  line1: string;
  line2: string;
  city: string;
  landmark: string;
};

export const emptyAddressForm: AddressForm = {
  label: "Home",
  fullName: "",
  phone: "",
  pincode: "",
  line1: "",
  line2: "",
  city: "",
  landmark: "",
};

export function buildAddress(form: AddressForm): Address {
  const line2Parts = [form.line2.trim(), form.landmark.trim()].filter(Boolean);
  return {
    id: `addr-${Date.now()}`,
    label: form.label,
    fullName: form.fullName.trim(),
    phone: form.phone.replace(/\D/g, ""),
    line1: form.line1.trim(),
    line2: line2Parts.join(", "),
    city: form.city.trim(),
    pincode: form.pincode.trim(),
    landmark: form.landmark.trim() || undefined,
  };
}

export function addressToForm(address: Address): AddressForm {
  const label = ADDRESS_LABELS.some((l) => l.id === address.label)
    ? (address.label as AddressLabelId)
    : "Other";
  return {
    label,
    fullName: address.fullName ?? address.label,
    phone: address.phone ?? "",
    pincode: address.pincode,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    landmark: address.landmark ?? "",
  };
}

export function validateAddressForm(form: AddressForm): string | null {
  if (!form.fullName.trim()) return "Enter your full name";
  const phone = form.phone.replace(/\D/g, "");
  if (phone.length !== 10) return "Enter a valid 10-digit mobile number";
  if (!/^\d{6}$/.test(form.pincode.trim())) return "Enter a valid 6-digit pincode";
  if (!form.line1.trim()) return "Enter flat, house no., or building";
  if (!form.line2.trim()) return "Enter area, street, or locality";
  if (!form.city.trim()) return "Enter your city";
  return null;
}

type SelectionMode = "current" | "saved" | "new";

type Props = {
  form: AddressForm;
  onFormChange: (form: AddressForm) => void;
  selectedAddressId: string | null;
  onSelectSaved: (address: Address | null) => void;
  onModeChange?: (mode: SelectionMode) => void;
};

const labelIcons = {
  Home,
  Work: Briefcase,
  Other: MapPin,
};

export function AddressSelector({
  form,
  onFormChange,
  selectedAddressId,
  onSelectSaved,
  onModeChange,
}: Props) {
  const gps = useLocationStore((s) => s.position);
  const cityName = useLocationStore((s) => s.cityName);
  const savedAddresses = useAuthStore((s) => s.addresses);
  const [mode, setMode] = useState<SelectionMode>(
    savedAddresses.length > 0 ? "saved" : "current"
  );
  const [loadingGps, setLoadingGps] = useState(false);
  const [gpsApplied, setGpsApplied] = useState(false);

  const setModeAndNotify = (next: SelectionMode) => {
    setMode(next);
    onModeChange?.(next);
  };

  const updateField = (field: keyof AddressForm, value: string) =>
    onFormChange({ ...form, [field]: value });

  const applyCurrentLocation = useCallback(async () => {
    if (!gps) return;
    setLoadingGps(true);
    try {
      const place = await reverseGeocode(gps.latitude, gps.longitude);
      if (place) {
        onFormChange({
          ...form,
          city: place.city,
          pincode: place.pincode || form.pincode,
          line1: place.line1 || form.line1,
          line2: place.line2 || form.line2,
        });
        setGpsApplied(true);
        onSelectSaved(null);
      }
    } finally {
      setLoadingGps(false);
    }
  }, [gps, form, onFormChange, onSelectSaved]);

  useEffect(() => {
    if (mode === "current" && gps && !gpsApplied) {
      applyCurrentLocation();
    }
  }, [mode, gps, gpsApplied, applyCurrentLocation]);

  const selectSaved = (address: Address) => {
    onSelectSaved(address);
    onFormChange(addressToForm(address));
    setModeAndNotify("saved");
  };

  const selectNew = () => {
    onSelectSaved(null);
    onFormChange({ ...emptyAddressForm, fullName: form.fullName, phone: form.phone });
    setModeAndNotify("new");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            setGpsApplied(false);
            setModeAndNotify("current");
          }}
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
            mode === "current"
              ? "border-brand-primary bg-brand-surface"
              : "border-gray-200 hover:border-brand-primary/40"
          )}
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-brand-primary shadow-sm">
            <Navigation className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Current location</p>
            <p className="truncate text-xs text-ink-muted">
              {gps ? cityName ?? "Detecting…" : "Enable GPS"}
            </p>
          </div>
        </button>

        {savedAddresses.map((address) => {
          const Icon = labelIcons[address.label as keyof typeof labelIcons] ?? MapPin;
          const selected = mode === "saved" && selectedAddressId === address.id;
          return (
            <button
              key={address.id}
              type="button"
              onClick={() => selectSaved(address)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                selected
                  ? "border-brand-primary bg-brand-surface"
                  : "border-gray-200 hover:border-brand-primary/40"
              )}
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-brand-primary shadow-sm">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{address.label}</p>
                <p className="truncate text-xs text-ink-muted">
                  {address.line1}, {address.city}
                </p>
              </div>
              {selected && <Check className="ml-auto h-4 w-4 text-brand-primary" />}
            </button>
          );
        })}

        <button
          type="button"
          onClick={selectNew}
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-dashed p-3 text-left transition-colors",
            mode === "new"
              ? "border-brand-primary bg-brand-surface"
              : "border-gray-300 hover:border-brand-primary/40"
          )}
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gray-50 text-ink-muted">
            <Plus className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Add new</p>
            <p className="text-xs text-ink-muted">Home, Work, Other</p>
          </div>
        </button>
      </div>

      {mode === "current" && (
        <div className="rounded-xl border border-brand-primary/20 bg-brand-surface/50 p-4">
          <p className="text-sm text-ink-muted">
            {loadingGps
              ? "Fetching your address from GPS…"
              : gpsApplied
                ? "Address fields pre-filled from your current location. You can edit below."
                : gps
                  ? "Tap refresh to use your GPS location."
                  : "Allow location access to auto-fill your delivery address."}
          </p>
          {gps && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setGpsApplied(false);
                applyCurrentLocation();
              }}
              disabled={loadingGps}
            >
              <Navigation className="mr-1.5 h-3.5 w-3.5" />
              {loadingGps ? "Detecting…" : "Refresh location"}
            </Button>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 p-5 shadow-card">
        <h2 className="mb-1 text-base font-bold text-ink">Delivery address</h2>
        <p className="mb-4 text-sm text-ink-muted">
          {mode === "new"
            ? "Save as Home, Work, or Other for faster checkout next time."
            : "Confirm or edit the delivery details below."}
        </p>

        {mode === "new" && (
          <div className="mb-4 flex flex-wrap gap-2">
            {ADDRESS_LABELS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => updateField("label", id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  form.label === id
                    ? "border-brand-primary bg-brand-surface text-brand-primary"
                    : "border-gray-200 text-ink-muted hover:border-brand-primary/40"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <Input
            id="fullName"
            label="Full name"
            placeholder="Name of person receiving the order"
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
          />
          <Input
            id="phone"
            label="Mobile number"
            type="tel"
            inputMode="numeric"
            placeholder="10-digit mobile number"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="pincode"
              label="Pincode"
              inputMode="numeric"
              placeholder="560001"
              maxLength={6}
              value={form.pincode}
              onChange={(e) =>
                updateField("pincode", e.target.value.replace(/\D/g, ""))
              }
            />
            <Input
              id="city"
              label="City"
              placeholder="Bengaluru"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
          </div>
          <Input
            id="line1"
            label="Flat / House no. / Building"
            placeholder="402, Sunrise Apartments"
            value={form.line1}
            onChange={(e) => updateField("line1", e.target.value)}
          />
          <Input
            id="line2"
            label="Area, street, sector, village"
            placeholder="MG Road, Indiranagar"
            value={form.line2}
            onChange={(e) => updateField("line2", e.target.value)}
          />
          <Input
            id="landmark"
            label="Landmark (optional)"
            placeholder="Near metro station, opposite mall, etc."
            value={form.landmark}
            onChange={(e) => updateField("landmark", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
