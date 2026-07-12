"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart";
import { useCheckoutStore } from "@/lib/stores/checkout";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";
import { CheckoutProgress } from "@/components/checkout/CheckoutProgress";
import { Button } from "@/components/ui/Button";
import { isNavigatingToOrderSuccess } from "@/lib/checkout/success-nav";
import { verifyAndCompleteOrder } from "@/lib/checkout/payment-flow";

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;

function PaymentVerifyingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const pollCount = useRef(0);
  const completedRef = useRef(false);
  const [message, setMessage] = useState("Verifying your payment... Please wait.");

  const orderIdParam = searchParams.get("orderId");

  const items = useCartStore((s) => s.items);
  const totals = useCartStore((s) => s.totals());
  const clearCart = useCartStore((s) => s.clearCart);

  const verifyingPayment = useCheckoutStore((s) => s.verifyingPayment);
  const deliveryAddress = useCheckoutStore((s) => s.deliveryAddress);
  const addressMode = useCheckoutStore((s) => s.addressMode);
  const payment = useCheckoutStore((s) => s.payment);
  const checkoutStore = useCheckoutStore();

  const user = useAuthStore((s) => s.user);
  const savedAddresses = useAuthStore((s) => s.addresses);
  const addAddress = useAuthStore((s) => s.addAddress);

  const razorpayOrderId =
    orderIdParam ?? verifyingPayment?.razorpayOrderId ?? null;
  const razorpayPaymentId = verifyingPayment?.razorpayPaymentId;

  useEffect(() => {
    if (!hydrated || completedRef.current) return;
    // Cart may already be empty after a successful verify+complete — do not
    // bounce back to review/cart and steal the success redirect.
    if (isNavigatingToOrderSuccess()) return;
    if (!razorpayOrderId || !deliveryAddress || items.length === 0) {
      router.replace("/checkout/review");
    }
  }, [hydrated, razorpayOrderId, deliveryAddress, items.length, router]);

  useEffect(() => {
    if (!hydrated || !razorpayOrderId || !deliveryAddress) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (!active || completedRef.current) return;

      const result = await verifyAndCompleteOrder({
        items,
        totals,
        payment: verifyingPayment?.paymentMethod ?? payment,
        selectedAddress: deliveryAddress!,
        addressMode,
        savedAddresses,
        addAddress,
        user,
        checkoutStore,
        clearCart,
        router,
        onPlacingChange: () => {},
        razorpayOrderId,
        razorpayPaymentId,
      });

      if (!active) return;

      if (result === "success") {
        completedRef.current = true;
        return;
      }

      if (result === "failed") {
        router.replace("/payment/failed");
        return;
      }

      pollCount.current += 1;
      if (pollCount.current >= MAX_POLLS) {
        setMessage(
          "Payment verification is taking longer than expected. You can wait or retry."
        );
        return;
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    hydrated,
    razorpayOrderId,
    razorpayPaymentId,
    deliveryAddress,
    items,
    totals,
    payment,
    verifyingPayment?.paymentMethod,
    addressMode,
    savedAddresses,
    addAddress,
    user,
    checkoutStore,
    clearCart,
    router,
  ]);

  if (!hydrated) return null;

  return (
    <div className="container-page py-6">
      <CheckoutProgress currentStep="review" />

      <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-surface text-brand-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-ink">Verifying Payment</h1>
          <p className="mt-2 text-sm text-ink-muted">{message}</p>
        </div>
        <p className="text-xs text-ink-soft">
          Please do not close this page or attempt another payment while verification
          is in progress.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/payment/failed">
            <Button variant="outline" size="sm">
              Payment Failed?
            </Button>
          </Link>
          <Link href="/checkout/review">
            <Button variant="secondary" size="sm">
              Back to Review
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentVerifyingPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-10 text-center text-ink-muted">
          Loading...
        </div>
      }
    >
      <PaymentVerifyingInner />
    </Suspense>
  );
}
