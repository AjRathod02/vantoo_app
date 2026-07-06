"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order, OrderStatus } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";

const statuses: OrderStatus[] = [
  "confirmed",
  "packed",
  "in_transit",
  "delivered",
  "cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const update = async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast.error("Update failed");
      return;
    }
    toast.success("Order updated");
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Orders</h1>

      {loading ? (
        <p className="text-ink-muted">Loading orders...</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-ink">#{order.id}</p>
                  <p className="text-xs text-ink-soft">
                    {new Date(order.placedAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <p className="mb-3 text-sm text-ink-muted">
                {order.items.length} items · {formatINR(order.total)} ·{" "}
                {order.paymentMethod.toUpperCase()} ·{" "}
                {order.paymentStatus ?? "pending"}
              </p>

              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={order.status === status ? "primary" : "outline"}
                    onClick={() => update(order.id, { status })}
                  >
                    {status.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>

              {order.status === "in_transit" && (
                <Button
                  size="sm"
                  className="mt-3"
                  variant="secondary"
                  onClick={() =>
                    update(order.id, {
                      riderName: "Rajesh Kumar",
                      riderPhone: "+91 98765 43210",
                      riderLat: 12.975 + Math.random() * 0.02,
                      riderLng: 77.6 + Math.random() * 0.02,
                    })
                  }
                >
                  Update rider location
                </Button>
              )}

              {order.refundStatus === "requested" && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      update(order.id, {
                        refundStatus: "processing",
                      })
                    }
                  >
                    Process refund
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      update(order.id, {
                        refundStatus: "completed",
                        refundAmount: order.total,
                      })
                    }
                  >
                    Complete refund
                  </Button>
                </div>
              )}

              <Link
                href={`/orders/${order.id}/track`}
                className="mt-3 inline-block text-sm font-medium text-brand-primary"
              >
                View live tracking →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
