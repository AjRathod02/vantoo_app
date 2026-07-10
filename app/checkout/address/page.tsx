"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/stores/cart";
import { useCheckoutStore } from "@/lib/stores/checkout";
import { useAuthStore } from "@/lib/stores/auth";
import { useLocationStore } from "@/lib/stores/location";
import { useHydrated } from "@/lib/useHydrated";
import { CheckoutShell } from "@/components/checkout/CheckoutShell";
import { LiveOrderMap } from "@/components/LiveOrderMap";
import {
  AddressSelector,
  buildAddress,
  emptyAddressForm,
  validateAddressForm,
} from "@/components/address/AddressSelector";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";
import { useRequireCart } from "@/lib/checkout/use-checkout-guards";

export default function CheckoutAddressPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { hasItems } = useRequireCart();
  const totals = useCartStore((s) => s.totals());
  const gps = useLocationStore((s) => s.position);
  const user = useAuthStore((s) => s.user);
  const savedAddresses = useAuthStore((s) => s.addresses);

  const addressForm = useCheckoutStore((s) => s.addressForm);
  const setAddressForm = useCheckoutStore((s) => s.setAddressForm);
  const selectedAddressId = useCheckoutStore((s) => s.selectedAddressId);
  const setSelectedAddressId = useCheckoutStore((s) => s.setSelectedAddressId);
  const addressMode = useCheckoutStore((s) => s.addressMode);
  const setAddressMode = useCheckoutStore((s) => s.setAddressMode);
  const setDeliveryAddress = useCheckoutStore((s) => s.setDeliveryAddress);
  const ensureCheckoutReference = useCheckoutStore((s) => s.ensureCheckoutReference);

  useEffect(() => {
    if (!hydrated) return;
    ensureCheckoutReference();
    if (
      !addressForm.fullName &&
      !addressForm.phone &&
      !addressForm.line1
    ) {
      setAddressForm({
        ...emptyAddressForm,
        fullName: user?.name ?? "",
        phone: user?.phone ?? "",
        city: savedAddresses.find((a) => a.isDefault)?.city ?? "",
      });
      const defaultId = savedAddresses.find((a) => a.isDefault)?.id ?? null;
      if (defaultId) setSelectedAddressId(defaultId);
      if (savedAddresses.length > 0) setAddressMode("saved");
    }
  }, [
    hydrated,
    addressForm.fullName,
    addressForm.phone,
    addressForm.line1,
    user,
    savedAddresses,
    setAddressForm,
    setSelectedAddressId,
    setAddressMode,
    ensureCheckoutReference,
  ]);

  if (!hydrated || !hasItems) return null;

  const handleContinue = () => {
    const error = validateAddressForm(addressForm);
    if (error) {
      toast.error(error);
      return;
    }
    const built = buildAddress(addressForm);
    const withGps =
      gps && addressMode === "current"
        ? { ...built, latitude: gps.latitude, longitude: gps.longitude }
        : built;
    setDeliveryAddress(withGps);
    router.push("/checkout/payment");
  };

  return (
    <CheckoutShell title="Delivery Address" currentStep="address" totals={totals}>
      <LiveOrderMap
        className="h-48 w-full"
        showRoute={false}
        destinationLat={gps?.latitude}
        destinationLng={gps?.longitude}
      />
      <AddressSelector
        form={addressForm}
        onFormChange={setAddressForm}
        selectedAddressId={selectedAddressId}
        onSelectSaved={(addr) => setSelectedAddressId(addr?.id ?? null)}
        onModeChange={setAddressMode}
      />
      <div className="flex gap-3">
        <Link href="/cart">
          <Button variant="outline">Back</Button>
        </Link>
        <Button className="flex-1" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </CheckoutShell>
  );
}
