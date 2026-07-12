"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Headphones,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { useCartStore } from "@/lib/stores/cart";
import { useCheckoutStore } from "@/lib/stores/checkout";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import { paymentMethodLabel } from "@/lib/checkout/constants";
import { retryPayment } from "@/lib/checkout/payment-flow";

function FailedInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const [retrying, setRetrying] = useState(false);

  const pendingPayment = useCheckoutStore((s) => s.pendingPayment);
  const checkoutReferenceId = useCheckoutStore((s) => s.checkoutReferenceId);
  const deliveryAddress = useCheckoutStore((s) => s.deliveryAddress);
  const addressMode = useCheckoutStore((s) => s.addressMode);
  const checkoutStore = useCheckoutStore();

  const items = useCartStore((s) => s.items);
  const totals = useCartStore((s) => s.totals());
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);
  const savedAddresses = useAuthStore((s) => s.addresses);
  const addAddress = useAuthStore((s) => s.addAddress);

  const reason =
    searchParams.get("reason") ||
    pendingPayment?.failureReason ||
    "Your payment could not be completed. No money was charged, or a refund will be issued automatically.";

  const failedAt = pendingPayment?.failedAt
    ? new Date(pendingPayment.failedAt)
    : new Date();

  const canRetry =
    hydrated &&
    Boolean(pendingPayment) &&
    Boolean(deliveryAddress) &&
    items.length > 0;

  const handleRetry = () => {
    if (!pendingPayment || !deliveryAddress) return;
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
    <div className="container-page mx-auto max-w-xl animate-fade-in space-y-6 py-10">
      <div className="overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 via-orange-50 to-brand-surface p-6 text-center shadow-card sm:p-8">
        <span className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-red-500 text-white shadow-lg">
          <span className="absolute inset-0 animate-ping rounded-full bg-red-400/30" />
          <AlertCircle className="relative h-10 w-10" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-ink sm:text-3xl">
          Payment Failed
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Don&apos;t worry — your cart is safe. You can retry payment without
          rebuilding your order.
        </p>
        <p className="mt-3 rounded-xl bg-white/70 px-4 py-2 text-sm font-medium text-red-700">
          {reason}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 p-5 shadow-card">
        <h2 className="mb-4 text-sm font-bold text-ink">Payment Details</h2>
        <dl className="space-y-3 text-sm">
          {(checkoutReferenceId || pendingPayment) && (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Order Reference ID</dt>
              <dd className="font-mono font-medium text-ink">
                {checkoutReferenceId ?? "—"}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Payment Reference ID</dt>
            <dd className="break-all font-mono text-xs font-medium text-ink sm:text-sm">
              {pendingPayment?.razorpayPaymentId ||
                pendingPayment?.razorpayOrderId ||
                "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Amount</dt>
            <dd className="font-bold text-ink">
              {pendingPayment ? formatINR(pendingPayment.amount) : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Payment Method</dt>
            <dd className="font-medium text-ink">
              {pendingPayment
                ? paymentMethodLabel(pendingPayment.paymentMethod)
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Date &amp; Time</dt>
            <dd className="font-medium text-ink">
              {failedAt.toLocaleDateString()} · {failedAt.toLocaleTimeString()}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {canRetry ? (
          <Button onClick={handleRetry} disabled={retrying} fullWidth className="gap-2">
            <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
            {retrying ? "Processing..." : "Retry Payment"}
          </Button>
        ) : (
          <Link href="/checkout/review">
            <Button fullWidth className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry Payment
            </Button>
          </Link>
        )}
        <Link href="/checkout/payment">
          <Button fullWidth variant="secondary" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Choose Another Payment Method
          </Button>
        </Link>
        <Link href="/checkout/review">
          <Button fullWidth variant="outline" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Return to Checkout
          </Button>
        </Link>
        <Link href="/contact">
          <Button fullWidth variant="outline" className="gap-2">
            <Headphones className="h-4 w-4" />
            Contact Support
          </Button>
        </Link>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-brand-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Continue shopping
      </Link>
    </div>
  );
}

export default function PaymentFailedPublicPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-10 text-center text-ink-muted">
          Loading...
        </div>
      }
    >
      <FailedInner />
    </Suspense>
  );
}
