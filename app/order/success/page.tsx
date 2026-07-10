"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  FileText,
  MapPin,
  Navigation,
  PartyPopper,
} from "lucide-react";
import type { Order } from "@/lib/types";
import { api } from "@/lib/api";
import { useHydrated } from "@/lib/useHydrated";
import { CheckoutProgress } from "@/components/checkout/CheckoutProgress";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatINR } from "@/lib/utils";
import { estimatedDeliveryLabel, paymentMethodLabel } from "@/lib/checkout/constants";

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated || !orderId) return;
    api
      .order(orderId)
      .then((d) => setOrder(d.order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [hydrated, orderId]);

  useEffect(() => {
    if (hydrated && !orderId) {
      router.replace("/orders");
    }
  }, [hydrated, orderId, router]);

  if (!hydrated || !orderId) return null;

  const displayPaymentId =
    paymentId ?? order?.razorpayPaymentId ?? (order?.paymentMethod === "cod" ? "COD" : "—");

  return (
    <div className="container-page py-6">
      <CheckoutProgress currentStep="complete" />

      {loading ? (
        <div className="mx-auto max-w-xl space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : !order ? (
        <div className="mx-auto max-w-xl text-center">
          <p className="text-lg font-semibold text-ink">Order not found</p>
          <Link href="/orders" className="mt-4 inline-block">
            <Button>View Orders</Button>
          </Link>
        </div>
      ) : (
        <div className="mx-auto max-w-xl space-y-6">
          <div className="overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-card">
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
              <span className="relative mb-4 grid h-16 w-16 shrink-0 place-items-center rounded-full bg-green-500 text-white shadow-lg sm:mb-0 sm:mr-5">
                <Check className="h-8 w-8" strokeWidth={3} />
                <PartyPopper className="absolute -right-1 -top-1 h-5 w-5 text-amber-500" />
              </span>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-ink sm:text-2xl">
                  Order Confirmed!
                </h1>
                <p className="mt-1 text-sm text-ink-muted">
                  Thank you for your order. We&apos;ve received it and will start
                  preparing it shortly.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 p-5 shadow-card">
            <h2 className="mb-4 text-sm font-bold text-ink">Order Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Order ID</dt>
                <dd className="font-mono font-bold text-brand-primary">#{order.id}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Payment ID</dt>
                <dd className="font-mono text-xs font-medium text-ink sm:text-sm">
                  {displayPaymentId}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Payment Method</dt>
                <dd className="font-medium text-ink">
                  {paymentMethodLabel(order.paymentMethod)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Total Paid</dt>
                <dd className="font-bold text-ink">{formatINR(order.total)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Estimated Delivery</dt>
                <dd className="font-medium text-ink">
                  {order.tracking?.etaMinutes
                    ? `${order.tracking.etaMinutes} minutes`
                    : estimatedDeliveryLabel(order.service)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-100 p-5 shadow-card">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <MapPin className="h-4 w-4 text-brand-primary" />
              Delivering To
            </h2>
            <p className="text-sm text-ink-muted">
              {order.address.line1}, {order.address.line2}, {order.address.city} -{" "}
              {order.address.pincode}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href={`/orders/${order.id}`}>
              <Button variant="outline" fullWidth className="gap-2">
                <FileText className="h-4 w-4" />
                View Invoice
              </Button>
            </Link>
            <Link href={`/orders/${order.id}/track?placed=1`}>
              <Button fullWidth className="gap-2">
                <Navigation className="h-4 w-4" />
                Track Order
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <Link href="/">
              <Button variant="secondary">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
