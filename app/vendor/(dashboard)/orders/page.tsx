"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { LocationStatusBadge } from "@/components/location/LocationStatusBadge";
import type { OrderStatus } from "@/lib/types";

interface VendorOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  placedAt: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  function load() {
    fetch("/api/vendor/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId);
    await fetch("/api/vendor/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    setUpdating(null);
    load();
  }

  if (loading) return <p className="text-ink-muted">Loading orders...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Orders</h1>
          <p className="text-sm text-ink-muted">
            Manage incoming orders from customers.
          </p>
        </div>
        <LocationStatusBadge />
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p className="text-ink-muted">No orders yet. They will appear here when customers place orders.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">#{order.orderNumber}</p>
                  <p className="text-sm text-ink-muted">
                    {new Date(order.placedAt).toLocaleString("en-IN")} · {formatINR(order.totalAmount)}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <ul className="mt-3 space-y-1 text-sm text-ink-muted">
                {order.items.map((item, i) => (
                  <li key={i}>{item.quantity}x {item.name} — {formatINR(item.price)}</li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                {order.status === "confirmed" && (
                  <Button size="sm" disabled={updating === order.id} onClick={() => updateStatus(order.id, "preparing")}>
                    Start Preparing
                  </Button>
                )}
                {order.status === "preparing" && (
                  <Button size="sm" disabled={updating === order.id} onClick={() => updateStatus(order.id, "packed")}>
                    Mark Packed
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
