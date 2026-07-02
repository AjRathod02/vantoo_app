"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Clock, Phone } from "lucide-react";
import type { Order } from "@/lib/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { STATUS_FLOW, statusMeta, isOngoing } from "@/lib/orderStatus";
import { LiveOrderMap } from "@/components/LiveOrderMap";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/utils/supabase/client";

export default function TrackOrderPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .order(id)
        .then((d) => active && setOrder(d.order))
        .catch(() => active && setOrder(null))
        .finally(() => active && setLoading(false));

    load();
    const timer = setInterval(load, 5000);

    const supabase = createClient();
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container-page py-6">
        <Skeleton className="h-96 w-full" />
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

  const currentIndex =
    order.status === "cancelled" ? -1 : STATUS_FLOW.indexOf(order.status);
  const rider = order.tracking;

  return (
    <div className="container-page py-6">
      <Link
        href={`/orders/${order.id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" />
        Order #{order.id}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-100 p-5 shadow-card">
            <div className="mb-1 flex items-center gap-2 text-brand-primary">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-semibold">
                {isOngoing(order.status)
                  ? "Estimated arrival in 25-30 min"
                  : statusMeta[order.status].label}
              </span>
            </div>
            <p className="text-sm text-ink-muted">
              {statusMeta[order.status].description}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 p-5 shadow-card">
            <h2 className="mb-4 text-sm font-bold text-ink">Order Status</h2>
            <ol className="relative space-y-6">
              {STATUS_FLOW.map((status, i) => {
                const done = i <= currentIndex;
                const active = i === currentIndex;
                const meta = statusMeta[status];
                return (
                  <li key={status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-full border-2 transition-colors",
                          done
                            ? "border-brand-primary bg-brand-primary text-white"
                            : "border-gray-300 bg-white text-ink-soft",
                          active && "ring-4 ring-brand-primary/20"
                        )}
                      >
                        {done ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-bold">{i + 1}</span>
                        )}
                      </span>
                      {i < STATUS_FLOW.length - 1 && (
                        <span
                          className={cn(
                            "mt-1 h-10 w-0.5",
                            i < currentIndex ? "bg-brand-primary" : "bg-gray-200"
                          )}
                        />
                      )}
                    </div>
                    <div className="pt-1">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          done ? "text-ink" : "text-ink-soft"
                        )}
                      >
                        {meta.label}
                      </p>
                      <p className="text-xs text-ink-soft">{meta.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {rider?.riderName && (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 p-4 shadow-card">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-surface font-bold text-brand-primary">
                {rider.riderName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">{rider.riderName}</p>
                <p className="text-xs text-ink-soft">Your delivery partner</p>
              </div>
              {rider.riderPhone && (
                <a
                  href={`tel:${rider.riderPhone.replace(/\s/g, "")}`}
                  className="grid h-10 w-10 place-items-center rounded-full bg-brand-primary text-white"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>

        <LiveOrderMap
          showRoute
          className="min-h-[400px] w-full lg:min-h-full"
          riderLat={rider?.riderLat}
          riderLng={rider?.riderLng}
        />
      </div>
    </div>
  );
}
