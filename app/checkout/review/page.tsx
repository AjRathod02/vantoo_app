"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/stores/cart";
import { useCheckoutStore } from "@/lib/stores/checkout";
import { useAuthStore } from "@/lib/stores/auth";
import { CheckoutShell } from "@/components/checkout/CheckoutShell";
import { Button } from "@/components/ui/Button";
import { paymentOptions } from "@/lib/checkout/constants";
import { placeOrder } from "@/lib/checkout/payment-flow";
import { useRequireAddress } from "@/lib/checkout/use-checkout-guards";

export default function CheckoutReviewPage() {
  const router = useRouter();
  const { hydrated, hasAddress } = useRequireAddress();
  const [placing, setPlacing] = useState(false);

  const items = useCartStore((s) => s.items);
  const totals = useCartStore((s) => s.totals());
  const clearCart = useCartStore((s) => s.clearCart);

  const deliveryAddress = useCheckoutStore((s) => s.deliveryAddress);
  const addressForm = useCheckoutStore((s) => s.addressForm);
  const addressMode = useCheckoutStore((s) => s.addressMode);
  const payment = useCheckoutStore((s) => s.payment);
  const checkoutStore = useCheckoutStore();

  const user = useAuthStore((s) => s.user);
  const savedAddresses = useAuthStore((s) => s.addresses);
  const addAddress = useAuthStore((s) => s.addAddress);

  if (!hydrated || !hasAddress || !deliveryAddress) return null;

  const handlePlaceOrder = () => {
    placeOrder({
      items,
      totals,
      payment,
      selectedAddress: deliveryAddress,
      addressMode,
      savedAddresses,
      addAddress,
      user,
      checkoutStore,
      clearCart,
      router,
      onPlacingChange: setPlacing,
    });
  };

  return (
    <CheckoutShell title="Review Order" currentStep="review" totals={totals}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-100 p-4 shadow-card">
          <h3 className="mb-2 text-sm font-bold text-ink">Delivery Address</h3>
          <p className="text-sm font-medium text-ink">
            {deliveryAddress.label}
            {deliveryAddress.fullName &&
            deliveryAddress.fullName !== deliveryAddress.label
              ? ` · ${deliveryAddress.fullName}`
              : ""}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {addressForm.phone.replace(/\D/g, "")}
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            {deliveryAddress.line1}, {deliveryAddress.line2},{" "}
            {deliveryAddress.city} - {deliveryAddress.pincode}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 p-4 shadow-card">
          <h3 className="mb-2 text-sm font-bold text-ink">Payment</h3>
          <p className="text-sm text-ink-muted">
            {paymentOptions.find((p) => p.id === payment)?.label}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 p-4 shadow-card">
          <h3 className="mb-2 text-sm font-bold text-ink">
            Items ({items.length})
          </h3>
          <ul className="space-y-2">
            {items.map(({ product, quantity }) => (
              <li
                key={product.id}
                className="flex justify-between text-sm text-ink-muted"
              >
                <span>
                  {product.name} × {quantity}
                </span>
                <span className="font-medium text-ink">
                  ₹{product.price * quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/checkout/payment">
          <Button variant="outline" disabled={placing}>
            Back
          </Button>
        </Link>
        <Button className="flex-1" onClick={handlePlaceOrder} disabled={placing}>
          {placing ? "Processing..." : `Place Order · ₹${totals.total}`}
        </Button>
      </div>
    </CheckoutShell>
  );
}
