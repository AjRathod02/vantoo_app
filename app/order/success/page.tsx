"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  Download,
  FileText,
  MapPin,
  Navigation,
  Package,
  ShoppingBag,
} from "lucide-react";
import type { Order } from "@/lib/types";
import { api } from "@/lib/api";
import { useHydrated } from "@/lib/useHydrated";
import { useCartStore } from "@/lib/stores/cart";
import { clearNavigatingToOrderSuccess } from "@/lib/checkout/success-nav";
import { CheckoutProgress } from "@/components/checkout/CheckoutProgress";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatINR } from "@/lib/utils";
import {
  estimatedDeliveryLabel,
  paymentMethodLabel,
} from "@/lib/checkout/constants";

function invoiceNumberFor(order: Order) {
  return `INV-${order.id.replace(/[^a-zA-Z0-9]/g, "").slice(-10).toUpperCase()}`;
}

function downloadInvoiceText(order: Order, paymentId: string) {
  const invoiceNo = invoiceNumberFor(order);
  const lines = [
    "VANTOO — ORDER INVOICE",
    "======================",
    `Invoice: ${invoiceNo}`,
    `Order ID: ${order.id}`,
    `Payment ID: ${paymentId}`,
    `Date: ${new Date(order.placedAt).toLocaleString()}`,
    `Payment: ${paymentMethodLabel(order.paymentMethod)}`,
    "",
    "Items:",
    ...order.items.map(
      (item) =>
        `  - ${item.name} x${item.quantity}  ${formatINR(item.price * item.quantity)}`
    ),
    "",
    `Subtotal: ${formatINR(order.subtotal)}`,
    `Delivery: ${formatINR(order.deliveryFee)}`,
    `Tax: ${formatINR(order.tax)}`,
    order.discount > 0 ? `Discount: -${formatINR(order.discount)}` : null,
    `Total: ${formatINR(order.total)}`,
    "",
    `Deliver to: ${order.address.line1}, ${order.address.line2}, ${order.address.city} - ${order.address.pincode}`,
  ].filter(Boolean);

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoiceNo}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function OrderSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useHydrated();
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");
  const clearCart = useCartStore((s) => s.clearCart);
  const clearedRef = useRef(false);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    clearNavigatingToOrderSuccess();
    if (!clearedRef.current) {
      clearedRef.current = true;
      clearCart();
    }
  }, [clearCart]);

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

  useEffect(() => {
    if (!loading && order) {
      const t = requestAnimationFrame(() => setShowCheck(true));
      return () => cancelAnimationFrame(t);
    }
  }, [loading, order]);

  if (!hydrated || !orderId) return null;

  const displayPaymentId =
    paymentId ??
    order?.razorpayPaymentId ??
    (order?.paymentMethod === "cod" ? "COD" : "—");

  const eta =
    order?.tracking?.etaMinutes != null
      ? `${order.tracking.etaMinutes} minutes`
      : order
        ? estimatedDeliveryLabel(order.service)
        : "—";

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
        <div className="mx-auto max-w-xl animate-fade-in space-y-6">
          <div className="overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-brand-surface p-6 shadow-card sm:p-8">
            <div className="flex flex-col items-center text-center">
              <span
                className={`relative mb-4 grid h-20 w-20 place-items-center rounded-full bg-green-500 text-white shadow-lg transition-all duration-500 ${
                  showCheck ? "scale-100 opacity-100" : "scale-50 opacity-0"
                }`}
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-green-400/40" />
                <Check className="relative h-10 w-10" strokeWidth={3} />
              </span>
              <h1 className="text-2xl font-bold text-ink sm:text-3xl">
                Payment Successful
              </h1>
              <p className="mt-2 max-w-sm text-sm text-ink-muted">
                Your order is confirmed. We&apos;ve received it and will start
                preparing it shortly.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 p-5 shadow-card">
            <h2 className="mb-4 text-sm font-bold text-ink">Order Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Order ID</dt>
                <dd className="font-mono font-bold text-brand-primary">
                  #{order.id}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Payment ID</dt>
                <dd className="break-all font-mono text-xs font-medium text-ink sm:text-sm">
                  {displayPaymentId}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Invoice Number</dt>
                <dd className="font-mono font-medium text-ink">
                  {invoiceNumberFor(order)}
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
                <dd className="font-medium text-ink">{eta}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-100 p-5 shadow-card">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
              <Package className="h-4 w-4 text-brand-primary" />
              Order Summary
            </h2>
            <ul className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <li
                  key={`${item.productId}-${item.quantity}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 truncate text-ink">
                    {item.name}{" "}
                    <span className="text-ink-soft">×{item.quantity}</span>
                  </span>
                  <span className="shrink-0 font-medium text-ink">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-sm font-bold text-ink">
              <span>Total</span>
              <span>{formatINR(order.total)}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 p-5 shadow-card">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <MapPin className="h-4 w-4 text-brand-primary" />
              Delivering To
            </h2>
            <p className="text-sm text-ink-muted">
              {order.address.line1}, {order.address.line2}, {order.address.city}{" "}
              - {order.address.pincode}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link href={`/orders/${order.id}/track?placed=1`}>
              <Button fullWidth className="gap-2">
                <Navigation className="h-4 w-4" />
                Track Order
              </Button>
            </Link>
            <Link href="/">
              <Button variant="secondary" fullWidth className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
            <Button
              variant="outline"
              fullWidth
              className="gap-2"
              onClick={() => downloadInvoiceText(order, String(displayPaymentId))}
            >
              <Download className="h-4 w-4" />
              Download Invoice
            </Button>
            <Link href={`/orders/${order.id}`}>
              <Button variant="outline" fullWidth className="gap-2">
                <FileText className="h-4 w-4" />
                View Order
              </Button>
            </Link>
          </div>

          <p className="text-center text-sm">
            <Link
              href="/rate-app"
              className="font-semibold text-brand-primary hover:underline"
            >
              Rate Our App
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-10 text-center text-ink-muted">
          Loading...
        </div>
      }
    >
      <OrderSuccessInner />
    </Suspense>
  );
}
