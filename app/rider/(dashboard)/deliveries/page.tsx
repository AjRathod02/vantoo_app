"use client";

import { useCallback, useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { LocationStatusBadge } from "@/components/location/LocationStatusBadge";
import type { OrderStatus } from "@/lib/types";
import { useLocationStore } from "@/lib/stores/location";

interface AvailableOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  storeName?: string;
  placedAt: string;
}

interface ActiveDelivery {
  task: { id: string; orderId: string; status: string };
  orderNumber: string;
  orderStatus: string;
  totalAmount: number;
  deliveryAddress: { line1?: string; city?: string; pincode?: string };
}

export default function RiderDeliveriesPage() {
  const [available, setAvailable] = useState<AvailableOrder[]>([]);
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "available">("active");

  const activeOrderId = deliveries[0]?.task.orderId;
  const setActiveOrderId = useLocationStore((s) => s.setActiveOrderId);

  useEffect(() => {
    if (tab === "active" && activeOrderId) {
      setActiveOrderId(activeOrderId);
    } else {
      setActiveOrderId(null);
    }
    return () => setActiveOrderId(null);
  }, [tab, activeOrderId, setActiveOrderId]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/rider/deliveries?active=true").then((r) => r.json()),
      fetch("/api/rider/deliveries?mode=available").then((r) => r.json()).catch(() => ({ available: [] })),
    ])
      .then(([activeData, availData]) => {
        setDeliveries(activeData.deliveries ?? []);
        setAvailable(availData.available ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function acceptOrder(orderId: string) {
    setActionId(orderId);
    await fetch("/api/rider/deliveries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    setActionId(null);
    setTab("active");
    load();
  }

  async function updateStatus(orderId: string, status: string) {
    setActionId(orderId);
    await fetch("/api/rider/deliveries", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    setActionId(null);
    load();
  }

  const nextAction = (status: string): { label: string; next: string } | null => {
    if (status === "assigned" || status === "accepted") return { label: "Mark Picked Up", next: "picked" };
    if (status === "picked") return { label: "Start Delivery", next: "in_transit" };
    if (status === "in_transit") return { label: "Mark Delivered", next: "delivered" };
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Deliveries</h1>
          <p className="text-sm text-ink-muted">
            Accept new orders and update delivery status.
          </p>
        </div>
        <LocationStatusBadge />
      </div>

      <div className="flex gap-2">
        {(["active", "available"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
              tab === t ? "bg-brand-secondary text-white" : "bg-gray-100 text-ink-muted"
            }`}
          >
            {t} {t === "available" && available.length > 0 ? `(${available.length})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-muted">Loading...</p>
      ) : tab === "available" ? (
        available.length === 0 ? (
          <p className="text-ink-muted">No orders available. Go online to see packed orders ready for pickup.</p>
        ) : (
          <div className="space-y-4">
            {available.map((o) => (
              <div key={o.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-ink">#{o.orderNumber}</h2>
                    <p className="text-sm text-ink-muted">{o.storeName ?? "Store pickup"}</p>
                    <p className="text-xs text-ink-muted">{new Date(o.placedAt).toLocaleString("en-IN")}</p>
                  </div>
                  <Badge tone="orange">{formatINR(o.totalAmount)}</Badge>
                </div>
                <Button size="sm" className="mt-4" disabled={actionId === o.id} onClick={() => acceptOrder(o.id)}>
                  Accept Delivery
                </Button>
              </div>
            ))}
          </div>
        )
      ) : deliveries.length === 0 ? (
        <p className="text-ink-muted">No active deliveries.</p>
      ) : (
        <div className="space-y-4">
          {deliveries.map((d) => {
            const action = nextAction(d.orderStatus);
            return (
              <div key={d.task.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-ink">#{d.orderNumber}</h2>
                    <p className="text-sm text-ink-muted">
                      {d.deliveryAddress?.line1}, {d.deliveryAddress?.city} — {d.deliveryAddress?.pincode}
                    </p>
                  </div>
                  <OrderStatusBadge status={d.orderStatus as OrderStatus} />
                </div>
                {action && (
                  <Button
                    size="sm"
                    className="mt-4"
                    disabled={actionId === d.task.orderId}
                    onClick={() => updateStatus(d.task.orderId, action.next)}
                  >
                    {action.label}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
