"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Banknote,
  Landmark,
  Smartphone,
  Check,
} from "lucide-react";
import type { Address, PaymentMethod } from "@/lib/types";
import { useCartStore } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { OrderSummary } from "@/components/OrderSummary";
import { LiveOrderMap } from "@/components/LiveOrderMap";
import {
  AddressSelector,
  buildAddress,
  emptyAddressForm,
  validateAddressForm,
  type AddressForm,
} from "@/components/address/AddressSelector";
import { toast } from "@/lib/stores/toast";
import {
  openRazorpayCheckout,
  razorpayMethodForPayment,
} from "@/lib/payments/razorpay-client";

const steps = ["Address", "Payment", "Review"];

async function createVantooOrder(payload: Record<string, unknown>) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to place order");
  }
  return res.json();
}

const paymentOptions: {
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: typeof CreditCard;
}[] = [
  { id: "card", label: "Credit / Debit Card", desc: "Powered by Razorpay", icon: CreditCard },
  { id: "upi", label: "UPI", desc: "GPay, PhonePe, Paytm", icon: Smartphone },
  { id: "netbanking", label: "Net Banking", desc: "All major banks", icon: Landmark },
  { id: "cod", label: "Cash on Delivery", desc: "Pay when it arrives", icon: Banknote },
];

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const totals = useCartStore((s) => s.totals());
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);
  const savedAddresses = useAuthStore((s) => s.addresses);
  const addAddress = useAuthStore((s) => s.addAddress);
  const gps = useLocationStore((s) => s.position);

  const [step, setStep] = useState(0);
  const [addressForm, setAddressForm] = useState<AddressForm>(() => ({
    ...emptyAddressForm,
    fullName: user?.name ?? "",
    phone: user?.phone ?? "",
    city: savedAddresses.find((a) => a.isDefault)?.city ?? "",
  }));
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    savedAddresses.find((a) => a.isDefault)?.id ?? null
  );
  const [addressMode, setAddressMode] = useState<"current" | "saved" | "new">(
    savedAddresses.length > 0 ? "saved" : "current"
  );
  const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [placing, setPlacing] = useState(false);

  if (!hydrated) return null;

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-lg font-semibold text-ink">Your cart is empty</p>
        <Link href="/">
          <Button>Browse Vantoo</Button>
        </Link>
      </div>
    );
  }

  const selectedAddress = deliveryAddress ?? buildAddress(addressForm);

  const orderPayload = (extra: Record<string, unknown> = {}) => ({
    items: items.map((i) => ({
      productId: i.product.id,
      name: i.product.name,
      image: i.product.image,
      price: i.product.price,
      quantity: i.quantity,
    })),
    subtotal: totals.subtotal,
    deliveryFee: totals.deliveryFee,
    tax: totals.tax,
    discount: totals.discount,
    total: totals.total,
    paymentMethod: payment,
    address: selectedAddress,
    service: items[0].product.service,
    ...extra,
  });

  const saveAddressIfNew = (address: Address) => {
    if (addressMode !== "new") return;
    const exists = savedAddresses.some(
      (a) =>
        a.line1 === address.line1 &&
        a.pincode === address.pincode &&
        a.label === address.label
    );
    if (!exists) {
      addAddress({ ...address, isDefault: savedAddresses.length === 0 });
    }
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      if (payment === "cod") {
        const { order } = await createVantooOrder({
          ...orderPayload(),
          paymentStatus: "pending",
        });
        saveAddressIfNew(selectedAddress);
        clearCart();
        setPlacing(false);
        router.push(`/orders/${order.id}/track?placed=1`);
        return;
      }

      const payRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: totals.total }),
      });

      if (payRes.status === 401) {
        throw new Error("Session expired. Please sign in again.");
      }

      if (!payRes.ok) {
        const err = await payRes.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error || "Payment gateway unavailable"
        );
      }

      const { orderId, keyId, amount } = await payRes.json();

      await openRazorpayCheckout({
        key: keyId,
        amount,
        currency: "INR",
        name: "Vantoo",
        description: `Order · ${items.length} item(s)`,
        order_id: orderId,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: { color: "#FF6B00" },
        method:
          payment === "card" || payment === "upi" || payment === "netbanking"
            ? razorpayMethodForPayment(payment)
            : undefined,
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify(response),
            });
            if (!verifyRes.ok) throw new Error("Payment verification failed");
            const verified = await verifyRes.json();
            const { order } = await createVantooOrder({
              ...orderPayload(),
              paymentStatus: "paid",
              razorpayOrderId: verified.razorpayOrderId,
              razorpayPaymentId: verified.razorpayPaymentId,
            });
            saveAddressIfNew(selectedAddress);
            clearCart();
            router.push(`/orders/${order.id}/track?placed=1`);
          } catch {
            toast.error("Payment verified but order failed. Contact support.");
          } finally {
            setPlacing(false);
          }
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not place order");
      if (e instanceof Error && e.message.includes("sign in")) {
        router.push("/login?redirect=/checkout");
      }
      setPlacing(false);
    }
  };

  const goToNextStep = () => {
    if (step === 0) {
      const error = validateAddressForm(addressForm);
      if (error) {
        toast.error(error);
        return;
      }
      const built = buildAddress(addressForm);
      const withGps =
        gps && addressMode === "current"
          ? {
              ...built,
              latitude: gps.latitude,
              longitude: gps.longitude,
            }
          : built;
      setDeliveryAddress(withGps);
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="container-page py-6">
      <h1 className="mb-5 text-2xl font-bold text-ink">Checkout</h1>

      <div className="mb-6 flex items-center">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full text-sm font-bold",
                  i <= step
                    ? "bg-brand-primary text-white"
                    : "bg-gray-100 text-ink-soft"
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  i <= step ? "text-ink" : "text-ink-soft"
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "mx-3 h-0.5 flex-1",
                  i < step ? "bg-brand-primary" : "bg-gray-200"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {step === 0 && (
            <>
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
            </>
          )}

          {step === 1 && (
            <div className="space-y-3">
              {paymentOptions.map(({ id, label, desc, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setPayment(id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                    payment === id
                      ? "border-brand-primary bg-brand-surface"
                      : "border-gray-200 hover:border-brand-primary/40"
                  )}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">{label}</p>
                    <p className="text-xs text-ink-muted">{desc}</p>
                  </div>
                </button>
              ))}
              <p className="text-xs text-ink-soft">
                By placing an order you agree to our{" "}
                <Link href="/policies/refund" className="text-brand-primary">
                  Refund
                </Link>{" "}
                and{" "}
                <Link href="/policies/cancellation" className="text-brand-primary">
                  Cancellation
                </Link>{" "}
                policies.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 p-4 shadow-card">
                <h3 className="mb-2 text-sm font-bold text-ink">Delivery Address</h3>
                <p className="text-sm font-medium text-ink">
                  {selectedAddress.label}
                  {selectedAddress.fullName && selectedAddress.fullName !== selectedAddress.label
                    ? ` · ${selectedAddress.fullName}`
                    : ""}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  {addressForm.phone.replace(/\D/g, "")}
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  {selectedAddress.line1}, {selectedAddress.line2},{" "}
                  {selectedAddress.city} - {selectedAddress.pincode}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4 shadow-card">
                <h3 className="mb-2 text-sm font-bold text-ink">Payment</h3>
                <p className="text-sm text-ink-muted">
                  {paymentOptions.find((p) => p.id === payment)?.label}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={placing}>
                Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button className="flex-1" onClick={goToNextStep}>
                Continue
              </Button>
            ) : (
              <Button className="flex-1" onClick={placeOrder} disabled={placing}>
                {placing ? "Processing..." : `Place Order · ₹${totals.total}`}
              </Button>
            )}
          </div>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-gray-100 p-5 shadow-card lg:sticky lg:top-32">
          <h2 className="text-lg font-bold text-ink">Order Summary</h2>
          <OrderSummary {...totals} />
        </aside>
      </div>
    </div>
  );
}
