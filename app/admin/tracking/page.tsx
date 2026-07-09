"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LocationRole, Order } from "@/lib/types";
import { LiveTrackingMap } from "@/components/tracking/LiveTrackingMap";
import { FleetLiveMap } from "@/components/location/FleetLiveMap";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { LocationStatusBadge } from "@/components/location/LocationStatusBadge";
import { useLiveOrderTracking } from "@/lib/hooks/useLiveOrderTracking";
import { useLiveUserLocations } from "@/lib/hooks/useLiveUserLocations";

const ROLES: Array<LocationRole | "all"> = [
  "all",
  "customer",
  "rider",
  "vendor",
];

function ActiveOrderCard({ order }: { order: Order }) {
  const { location } = useLiveOrderTracking(order.id, order.tracking);

  return (
    <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-bold text-ink">#{order.id}</p>
          <p className="text-xs text-ink-muted">
            {order.tracking?.riderName ?? "Unassigned"}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <LiveTrackingMap
        className="h-56"
        status={order.status}
        showRoute
        rider={location}
        store={
          order.tracking?.storeLat && order.tracking?.storeLng
            ? {
                lat: order.tracking.storeLat,
                lng: order.tracking.storeLng,
                name: order.tracking.storeName,
              }
            : undefined
        }
        customer={
          order.tracking?.customerLat && order.tracking?.customerLng
            ? {
                lat: order.tracking.customerLat,
                lng: order.tracking.customerLng,
              }
            : undefined
        }
      />
      <Link
        href={`/orders/${order.id}/track`}
        className="text-sm font-semibold text-brand-primary hover:underline"
      >
        Open customer view →
      </Link>
    </div>
  );
}

export default function AdminLiveTrackingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<LocationRole | "all">("all");
  const [onlineOnly, setOnlineOnly] = useState(true);

  const { locations, connected } = useLiveUserLocations({
    scope: "admin",
    role: roleFilter === "all" ? undefined : roleFilter,
    online: onlineOnly,
  });

  const fleetLocations = useMemo(() => {
    if (roleFilter === "all") return locations;
    return locations.filter((l) => l.role === roleFilter);
  }, [locations, roleFilter]);

  useEffect(() => {
    const load = () =>
      fetch("/api/admin/tracking/active")
        .then((r) => r.json())
        .then((d) => setOrders(d.orders ?? []))
        .finally(() => setLoading(false));

    load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Live Operations Map</h1>
          <p className="text-sm text-ink-muted">
            Real-time locations for customers, riders, vendors, and active
            deliveries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LocationStatusBadge />
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
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setRoleFilter(role)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
              roleFilter === role
                ? "bg-brand-primary text-white"
                : "bg-gray-100 text-ink-muted"
            }`}
          >
            {role}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOnlineOnly((v) => !v)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            onlineOnly
              ? "bg-brand-accent/15 text-brand-accent"
              : "bg-gray-100 text-ink-muted"
          }`}
        >
          {onlineOnly ? "Online only" : "All users"}
        </button>
      </div>

      <FleetLiveMap
        locations={fleetLocations}
        className="overflow-hidden rounded-2xl border border-gray-100 shadow-card"
      />

      <div>
        <h2 className="mb-3 text-lg font-bold text-ink">Active deliveries</h2>
        {loading ? (
          <p className="text-ink-muted">Loading active deliveries…</p>
        ) : orders.length === 0 ? (
          <p className="text-ink-muted">No active deliveries right now.</p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {orders.map((order) => (
              <ActiveOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}