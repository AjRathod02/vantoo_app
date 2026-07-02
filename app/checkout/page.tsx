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
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OrderSummary } from "@/components/OrderSummary";
import { LiveOrderMap } from "@/components/LiveOrderMap";
import { toast } from "@/lib/stores/toast";
import { openRazorpayCheckout } from "@/lib/payments/razorpay-client";

const steps = ["Address", "Payment", "Review"];

type AddressForm = {
  fullName: string;
  phone: string;
  pincode: string;
  line1: string;
  line2: string;
  city: string;
  landmark: string;
};

const emptyAddressForm: AddressForm = {
  fullName: "",
  phone: "",
  pincode: "",
  line1: "",
  line2: "",
  city: "",
  landmark: "",
};

function buildAddress(form: AddressForm): Address {
  const line2Parts = [form.line2.trim(), form.landmark.trim()].filter(Boolean);
  return {
    id: `addr-${Date.now()}`,
    label: form.fullName.trim(),
    line1: form.line1.trim(),
    line2: line2Parts.join(", "),
    city: form.city.trim(),
    pincode: form.pincode.trim(),
  };
}

function validateAddressForm(form: AddressForm): string | null {
  if (!form.fullName.trim()) return "Enter your full name";
  const phone = form.phone.replace(/\D/g, "");
  if (phone.length !== 10) return "Enter a valid 10-digit mobile number";
  if (!/^\d{6}$/.test(form.pincode.trim())) return "Enter a valid 6-digit pincode";
  if (!form.line1.trim()) return "Enter flat, house no., or building";
  if (!form.line2.trim()) return "Enter area, street, or locality";
  if (!form.city.trim()) return "Enter your city";
  return null;
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

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const totals = useCartStore((s) => s.totals());
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(0);
  const [addressForm, setAddressForm] = useState<AddressForm>(() => ({
    ...emptyAddressForm,
    fullName: user?.name ?? "",
    phone: user?.phone ?? "",
  }));
  const [deliveryAddress, setDeliveryAddress] = useState<Address | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("upi");
  const [placing, setPlacing] = useState(false);

  const updateAddressField = (field: keyof AddressForm, value: string) =>
    setAddressForm((prev) => ({ ...prev, [field]: value }));

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

  const placeOrder = async () => {
    setPlacing(true);
    try {
      if (payment === "cod") {
        const { order } = await createVantooOrder({
          ...orderPayload(),
          paymentStatus: "pending",
        });
        clearCart();
        toast.success("Order placed successfully!");
        router.push(`/orders/${order.id}/track`);
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
            clearCart();
            toast.success("Payment successful! Order placed.");
            router.push(`/orders/${order.id}/track`);
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
      setDeliveryAddress(buildAddress(addressForm));
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
              <LiveOrderMap className="h-48 w-full" />
              <div className="rounded-2xl border border-gray-100 p-5 shadow-card">
                <h2 className="mb-1 text-base font-bold text-ink">Delivery address</h2>
                <p className="mb-4 text-sm text-ink-muted">
                  Enter where you want this order delivered.
                </p>
                <div className="space-y-4">
                  <Input
                    id="fullName"
                    label="Full name"
                    placeholder="Name of person receiving the order"
                    value={addressForm.fullName}
                    onChange={(e) => updateAddressField("fullName", e.target.value)}
                  />
                  <Input
                    id="phone"
                    label="Mobile number"
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit mobile number"
                    value={addressForm.phone}
                    onChange={(e) => updateAddressField("phone", e.target.value)}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      id="pincode"
                      label="Pincode"
                      inputMode="numeric"
                      placeholder="560001"
                      maxLength={6}
                      value={addressForm.pincode}
                      onChange={(e) =>
                        updateAddressField("pincode", e.target.value.replace(/\D/g, ""))
                      }
                    />
                    <Input
                      id="city"
                      label="City"
                      placeholder="Bengaluru"
                      value={addressForm.city}
                      onChange={(e) => updateAddressField("city", e.target.value)}
                    />
                  </div>
                  <Input
                    id="line1"
                    label="Flat / House no. / Building"
                    placeholder="402, Sunrise Apartments"
                    value={addressForm.line1}
                    onChange={(e) => updateAddressField("line1", e.target.value)}
                  />
                  <Input
                    id="line2"
                    label="Area, street, sector, village"
                    placeholder="MG Road, Indiranagar"
                    value={addressForm.line2}
                    onChange={(e) => updateAddressField("line2", e.target.value)}
                  />
                  <Input
                    id="landmark"
                    label="Landmark (optional)"
                    placeholder="Near metro station, opposite mall, etc."
                    value={addressForm.landmark}
                    onChange={(e) => updateAddressField("landmark", e.target.value)}
                  />
                </div>
              </div>
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
                <p className="text-sm font-medium text-ink">{selectedAddress.label}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {addressForm.phone.replace(/\D/g, "")}
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  {selectedAddress.line1}, {selectedAddress.line2}, {selectedAddress.city}{" "}
                  - {selectedAddress.pincode}
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
