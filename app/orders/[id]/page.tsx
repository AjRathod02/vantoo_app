"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Navigation } from "lucide-react";
import type { Order } from "@/lib/types";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/utils";
import { isOngoing } from "@/lib/orderStatus";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderSummary } from "@/components/OrderSummary";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .order(id)
      .then((d) => setOrder(d.order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container-page max-w-2xl space-y-4 py-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-lg font-semibold text-ink">Order not found</p>
        <Link href="/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page max-w-2xl space-y-5 py-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Order #{order.id}</h1>
          <p className="text-sm text-ink-soft">
            Placed on{" "}
            {new Date(order.placedAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {isOngoing(order.status) && (
        <div className="flex gap-3">
          <Link href={`/orders/${order.id}/track`} className="flex-1">
            <Button fullWidth size="lg">
              <Navigation className="h-5 w-5" />
              Track Order
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="lg"
            onClick={async () => {
              const res = await fetch(`/api/orders/${order.id}/cancel`, {
                method: "POST",
              });
              if (res.ok) {
                const data = await res.json();
                setOrder(data.order);
              }
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {order.refundStatus && order.refundStatus !== "none" && (
        <div className="rounded-2xl border border-brand-primary/20 bg-brand-surface p-4 text-sm">
          <p className="font-semibold text-ink">Refund status: {order.refundStatus}</p>
          {order.refundAmount && (
            <p className="text-ink-muted">Amount: {formatINR(order.refundAmount)}</p>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 p-4 shadow-card">
        <h2 className="mb-3 text-sm font-bold text-ink">Items</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <span className="relative h-12 w-12 overflow-hidden rounded-xl bg-gray-50">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{item.name}</p>
                <p className="text-xs text-ink-soft">Qty {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold text-ink">
                {formatINR(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 p-4 shadow-card">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
          <MapPin className="h-4 w-4 text-brand-primary" />
          Delivery Address
        </h2>
        <p className="text-sm text-ink-muted">
          {order.address.label} — {order.address.line1}, {order.address.line2},{" "}
          {order.address.city} - {order.address.pincode}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 p-4 shadow-card">
        <h2 className="mb-3 text-sm font-bold text-ink">Bill Details</h2>
        <OrderSummary
          subtotal={order.subtotal}
          deliveryFee={order.deliveryFee}
          tax={order.tax}
          discount={order.discount}
          total={order.total}
        />
      </div>
    </div>
  );
}
