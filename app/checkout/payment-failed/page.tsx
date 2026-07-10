"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Headphones,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { useCartStore } from "@/lib/stores/cart";
import { useCheckoutStore } from "@/lib/stores/checkout";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";
import { CheckoutProgress } from "@/components/checkout/CheckoutProgress";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import { paymentMethodLabel } from "@/lib/checkout/constants";
import { retryPayment } from "@/lib/checkout/payment-flow";

export default function PaymentFailedPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const [retrying, setRetrying] = useState(false);

  const pendingPayment = useCheckoutStore((s) => s.pendingPayment);
  const checkoutReferenceId = useCheckoutStore((s) => s.checkoutReferenceId);
  const deliveryAddress = useCheckoutStore((s) => s.deliveryAddress);
  const addressMode = useCheckoutStore((s) => s.addressMode);
  const payment = useCheckoutStore((s) => s.payment);
  const checkoutStore = useCheckoutStore();

  const items = useCartStore((s) => s.items);
  const totals = useCartStore((s) => s.totals());
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);
  const savedAddresses = useAuthStore((s) => s.addresses);
  const addAddress = useAuthStore((s) => s.addAddress);

  useEffect(() => {
    if (hydrated && !pendingPayment) {
      router.replace("/checkout/review");
    }
  }, [hydrated, pendingPayment, router]);

  if (!hydrated || !pendingPayment || !deliveryAddress) return null;

  const failedDate = new Date(pendingPayment.failedAt);

  const handleRetry = () => {
    setRetrying(true);
    retryPayment({
      items,
      totals,
      payment: pendingPayment.paymentMethod,
      selectedAddress: deliveryAddress,
      addressMode,
      savedAddresses,
      addAddress,
      user,
      checkoutStore,
      clearCart,
      router,
      onPlacingChange: setRetrying,
    });
  };

  return (
    <div className="container-page py-6">
      <CheckoutProgress currentStep="payment" />

      <div className="mx-auto max-w-xl space-y-6">
        <div className="overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-6 shadow-card">
          <div className="flex flex-col items-center text-center">
            <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-red-500 text-white shadow-lg">
              <AlertCircle className="h-8 w-8" />
            </span>
            <h1 className="text-xl font-bold text-ink sm:text-2xl">Payment Failed</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Unfortunately, your payment could not be completed.
            </p>
            <p className="mt-3 text-sm text-ink-muted">
              If any amount has been deducted, it will be automatically refunded by
              your bank or payment provider according to their processing timeline.
            </p>
            <p className="mt-3 text-sm text-ink-muted">
              Please try again or choose another payment method.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 p-5 shadow-card">
          <h2 className="mb-4 text-sm font-bold text-ink">Payment Details</h2>
          <dl className="space-y-3 text-sm">
            {pendingPayment.failureReason && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Reason</dt>
                <dd className="text-right font-medium text-red-600">
                  {pendingPayment.failureReason}
                </dd>
              </div>
            )}
            {checkoutReferenceId && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Order Reference ID</dt>
                <dd className="font-mono font-medium text-ink">{checkoutReferenceId}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Payment Reference ID</dt>
              <dd className="font-mono text-xs font-medium text-ink sm:text-sm">
                {pendingPayment.razorpayOrderId}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Date &amp; Time</dt>
              <dd className="font-medium text-ink">
                {failedDate.toLocaleDateString()} · {failedDate.toLocaleTimeString()}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Attempted Amount</dt>
              <dd className="font-bold text-ink">{formatINR(pendingPayment.amount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Payment Method</dt>
              <dd className="font-medium text-ink">
                {paymentMethodLabel(pendingPayment.paymentMethod)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={handleRetry} disabled={retrying} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {retrying ? "Processing..." : "Try Again"}
          </Button>
          <Link href="/checkout/payment">
            <Button variant="outline" fullWidth className="gap-2">
              <CreditCard className="h-4 w-4" />
              Choose Another Payment Method
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="outline" fullWidth className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Return to Cart
            </Button>
          </Link>
          <a href="mailto:support@vantoo.com">
            <Button variant="secondary" fullWidth className="gap-2">
              <Headphones className="h-4 w-4" />
              Contact Support
            </Button>
          </a>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={handleRetry}
            disabled={retrying}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Payment
          </Button>
        </div>

        <Link
          href="/checkout/review"
          className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Review Order
        </Link>
      </div>
    </div>
  );
}
