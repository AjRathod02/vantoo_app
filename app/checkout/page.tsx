"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  CreditCard,
  Banknote,
  Landmark,
  Smartphone,
  Check,
  Plus,
} from "lucide-react";
import type { PaymentMethod } from "@/lib/types";
import { useCartStore } from "@/lib/stores/cart";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { OrderSummary } from "@/components/OrderSummary";
import { MockMap } from "@/components/MockMap";
import { toast } from "@/lib/stores/toast";

const steps = ["Address", "Payment", "Review"];

const paymentOptions: {
  id: PaymentMethod;
  label: string;
  desc: string;
  icon: typeof CreditCard;
}[] = [
  { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, RuPay", icon: CreditCard },
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
  const addresses = useAuthStore((s) => s.addresses);

  const [step, setStep] = useState(0);
  const [addressId, setAddressId] = useState(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id
  );
  const [payment, setPayment] = useState<PaymentMethod>("upi");
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

  const selectedAddress = addresses.find((a) => a.id === addressId)!;

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const { order } = await res.json();
      clearCart();
      toast.success("Order placed successfully!");
      router.push(`/orders/${order.id}/track`);
    } catch {
      toast.error("Could not place order. Please try again.");
      setPlacing(false);
    }
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
              <MockMap className="h-48 w-full" />
              <div className="space-y-3">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAddressId(a.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                      addressId === a.id
                        ? "border-brand-primary bg-brand-surface"
                        : "border-gray-200 hover:border-brand-primary/40"
                    )}
                  >
                    <MapPin className="mt-0.5 h-5 w-5 text-brand-primary" />
                    <div>
                      <p className="text-sm font-semibold text-ink">{a.label}</p>
                      <p className="text-sm text-ink-muted">
                        {a.line1}, {a.line2}, {a.city} - {a.pincode}
                      </p>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => toast.info("Add address is mocked in this demo")}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-3 text-sm font-medium text-ink-muted hover:border-brand-primary hover:text-brand-primary"
                >
                  <Plus className="h-4 w-4" />
                  Add New Address
                </button>
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
                  <span
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-full border-2",
                      payment === id
                        ? "border-brand-primary"
                        : "border-gray-300"
                    )}
                  >
                    {payment === id && (
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-primary" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 p-4 shadow-card">
                <h3 className="mb-2 text-sm font-bold text-ink">
                  Delivery Address
                </h3>
                <p className="text-sm text-ink-muted">
                  {selectedAddress.label} — {selectedAddress.line1},{" "}
                  {selectedAddress.line2}, {selectedAddress.city} -{" "}
                  {selectedAddress.pincode}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4 shadow-card">
                <h3 className="mb-2 text-sm font-bold text-ink">Payment</h3>
                <p className="text-sm text-ink-muted">
                  {paymentOptions.find((p) => p.id === payment)?.label}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4 shadow-card">
                <h3 className="mb-3 text-sm font-bold text-ink">
                  Items ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-ink-muted">
                        {product.name} × {quantity}
                      </span>
                      <span className="font-medium text-ink">
                        ₹{product.price * quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={placing}
              >
                Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button className="flex-1" onClick={() => setStep((s) => s + 1)}>
                Continue
              </Button>
            ) : (
              <Button className="flex-1" onClick={placeOrder} disabled={placing}>
                {placing ? "Placing order..." : `Place Order · ₹${totals.total}`}
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
