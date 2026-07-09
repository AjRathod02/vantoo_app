"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { Order } from "@/lib/types";
import { api } from "@/lib/api";
import { LiveTrackingMap } from "@/components/tracking/LiveTrackingMap";
import {
  OrderTrackingTimeline,
  TrackingBottomCard,
} from "@/components/tracking/TrackingPanels";
import { OrderPlacedBanner } from "@/components/OrderPlacedBanner";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/utils/supabase/client";
import {
  useLiveOrderTracking,
  useTrackingNotifications,
} from "@/lib/hooks/useLiveOrderTracking";

export default function TrackOrderPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get("placed") === "1";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const { location, connected } = useLiveOrderTracking(
    id,
    order?.tracking
  );
  const { message: notification } = useTrackingNotifications(
    id,
    order?.status ?? "confirmed",
    location
  );

  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .order(id)
        .then(async (d) => {
          if (!active) return;
          let orderData = d.order;
          try {
            const trackRes = await fetch(`/api/orders/${id}/tracking`);
            if (trackRes.ok) {
              const trackData = await trackRes.json();
              if (trackData.tracking) {
                orderData = {
                  ...orderData,
                  tracking: { ...orderData.tracking, ...trackData.tracking },
                };
              }
            }
          } catch {
            // use order tracking as-is
          }
          setOrder(orderData);
        })
        .catch(() => active && setOrder(null))
        .finally(() => active && setLoading(false));

    load();

    const supabase = createClient();
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${id}`,
        },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container-page py-6">
        <Skeleton className="h-[480px] w-full rounded-2xl" />
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

  const tracking = order.tracking;

  return (
    <div className="container-page py-6">
      {justPlaced ? (
        <OrderPlacedBanner orderId={order.id} className="mb-6" />
      ) : (
        <Link
          href={`/orders/${order.id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" />
          Order #{order.id}
        </Link>
      )}

      {justPlaced && (
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href={`/orders/${order.id}`}>
            <Button variant="outline" size="sm">
              View order details
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary" size="sm">
              Continue shopping
            </Button>
          </Link>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink">Live Tracking</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            connected
              ? "bg-brand-accent/15 text-brand-accent"
              : "bg-gray-100 text-ink-muted"
          }`}
        >
          {connected ? "Live" : "Connecting…"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <LiveTrackingMap
          className="min-h-[420px] lg:min-h-[480px]"
          status={order.status}
          showRoute
          store={
            tracking?.storeLat && tracking?.storeLng
              ? {
                  lat: tracking.storeLat,
                  lng: tracking.storeLng,
                  name: tracking.storeName,
                }
              : undefined
          }
          customer={
            tracking?.customerLat && tracking?.customerLng
              ? { lat: tracking.customerLat, lng: tracking.customerLng }
              : undefined
          }
          rider={location}
          notification={notification}
        />

        <div className="space-y-5">
          <TrackingBottomCard order={order} location={location} />

          <div className="rounded-2xl border border-gray-100 p-5 shadow-card">
            <h2 className="mb-4 text-sm font-bold text-ink">
              Order Timeline
            </h2>
            <OrderTrackingTimeline status={order.status} />
          </div>
        </div>
      </div>
    </div>
  );
}
