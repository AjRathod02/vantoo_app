"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import type { Order } from "@/lib/types";
import { api } from "@/lib/api";
import { cn, formatINR } from "@/lib/utils";
import { isOngoing } from "@/lib/orderStatus";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

type Tab = "ongoing" | "delivered" | "cancelled";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("ongoing");

  useEffect(() => {
    api
      .orders()
      .then((d) => setOrders(d.orders))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    if (tab === "ongoing") return isOngoing(o.status);
    if (tab === "delivered") return o.status === "delivered";
    return o.status === "cancelled";
  });

  return (
    <div className="container-page max-w-3xl py-6">
      <h1 className="mb-4 text-2xl font-bold text-ink">My Orders</h1>

      <div className="mb-5 flex gap-1 rounded-xl bg-gray-100 p-1">
        {(["ongoing", "delivered", "cancelled"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors",
              tab === t ? "bg-white text-brand-primary shadow-sm" : "text-ink-muted"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-2xl border border-gray-100 p-4 shadow-card transition-shadow hover:shadow-cardHover"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-ink">#{order.id}</p>
                  <p className="text-xs text-ink-soft">
                    {new Date(order.placedAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-3">
                  {order.items.slice(0, 4).map((item) => (
                    <span
                      key={item.productId}
                      className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-gray-50"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </span>
                  ))}
                </div>
                <span className="font-bold text-ink">
                  {formatINR(order.total)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Package className="h-12 w-12 text-ink-soft" />
          <p className="text-ink-muted">No {tab} orders yet.</p>
          <Link href="/">
            <Button>Start Ordering</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
