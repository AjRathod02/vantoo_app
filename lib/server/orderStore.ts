import type { Order, OrderStatus, RiderLocationUpdate } from "@/lib/types";
import {
  DEFAULT_STORE,
  bearingDegrees,
  customerCoordsFromPincode,
  estimateEtaMinutes,
  haversineKm,
  lerpPoint,
} from "@/lib/tracking/geo";
import { publishRiderLocation } from "@/lib/tracking/broadcaster";

const globalForOrders = globalThis as unknown as {
  vantooOrders?: Map<string, Order>;
};

const orders = globalForOrders.vantooOrders ?? new Map<string, Order>();
if (process.env.NODE_ENV !== "production") {
  globalForOrders.vantooOrders = orders;
}

const STAGE_SCHEDULE: { status: OrderStatus; afterSeconds: number }[] = [
  { status: "confirmed", afterSeconds: 0 },
  { status: "preparing", afterSeconds: 15 },
  { status: "assigned", afterSeconds: 30 },
  { status: "picked", afterSeconds: 45 },
  { status: "in_transit", afterSeconds: 55 },
  { status: "delivered", afterSeconds: 120 },
];

const trackingTimers = new Map<string, ReturnType<typeof setInterval>>();

function enrichTracking(order: Order): Order["tracking"] {
  const store = {
    lat: order.tracking?.storeLat ?? DEFAULT_STORE.lat,
    lng: order.tracking?.storeLng ?? DEFAULT_STORE.lng,
  };
  const customer = {
    lat:
      order.tracking?.customerLat ??
      customerCoordsFromPincode(order.address.pincode).lat,
    lng:
      order.tracking?.customerLng ??
      customerCoordsFromPincode(order.address.pincode).lng,
  };

  const rider = {
    lat: order.tracking?.riderLat ?? store.lat,
    lng: order.tracking?.riderLng ?? store.lng,
  };

  const distanceKm = haversineKm(rider, customer);
  const speed = order.tracking?.riderSpeed ?? 28;
  const heading =
    order.tracking?.riderHeading ?? bearingDegrees(rider, customer);

  return {
    riderName: order.tracking?.riderName ?? "Rahul Sharma",
    riderPhone: order.tracking?.riderPhone ?? "+91 98765 43210",
    riderRating: order.tracking?.riderRating ?? 4.9,
    storeName: order.tracking?.storeName ?? "Vantoo Store",
    storeLat: store.lat,
    storeLng: store.lng,
    customerLat: customer.lat,
    customerLng: customer.lng,
    riderLat: rider.lat,
    riderLng: rider.lng,
    riderSpeed: speed,
    riderHeading: heading,
    distanceKm: Number(distanceKm.toFixed(2)),
    distanceRemainingM: Math.round(distanceKm * 1000),
    etaMinutes: estimateEtaMinutes(distanceKm, speed),
    updatedAt: order.tracking?.updatedAt ?? new Date().toISOString(),
  };
}

function broadcastTracking(order: Order) {
  const tracking = enrichTracking(order);
  if (!tracking?.riderLat || !tracking?.riderLng) return;

  const payload: RiderLocationUpdate = {
    orderId: order.id,
    lat: tracking.riderLat,
    lng: tracking.riderLng,
    speed: tracking.riderSpeed,
    heading: tracking.riderHeading,
    timestamp: tracking.updatedAt,
    riderName: tracking.riderName,
    riderPhone: tracking.riderPhone,
    riderRating: tracking.riderRating,
    etaMinutes: tracking.etaMinutes,
    distanceKm: tracking.distanceKm,
    distanceRemainingM: tracking.distanceRemainingM,
  };

  publishRiderLocation(order.id, payload);
}

export function deriveStatus(order: Order): OrderStatus {
  if (order.status === "cancelled") return "cancelled";
  const elapsed = (Date.now() - new Date(order.placedAt).getTime()) / 1000;
  let current: OrderStatus = "confirmed";
  for (const stage of STAGE_SCHEDULE) {
    if (elapsed >= stage.afterSeconds) current = stage.status;
  }
  return current;
}

export function saveOrder(order: Order) {
  const withTracking = {
    ...order,
    tracking: enrichTracking(order),
  };
  orders.set(order.id, withTracking);
  scheduleTrackingSimulation(order.id);
}

export function updateOrderTracking(
  id: string,
  tracking: Partial<Order["tracking"]>
) {
  const order = orders.get(id);
  if (!order) return;

  const updated: Order = {
    ...order,
    tracking: enrichTracking({
      ...order,
      tracking: {
        ...order.tracking,
        ...tracking,
        updatedAt: new Date().toISOString(),
      },
    }),
  };

  orders.set(id, updated);
  broadcastTracking(updated);
}

export function applyRiderLocationUpdate(
  orderId: string,
  update: Omit<RiderLocationUpdate, "orderId">
) {
  updateOrderTracking(orderId, {
    riderLat: update.lat,
    riderLng: update.lng,
    riderSpeed: update.speed,
    riderHeading: update.heading,
    etaMinutes: update.etaMinutes,
    distanceKm: update.distanceKm,
    distanceRemainingM: update.distanceRemainingM,
    updatedAt: update.timestamp ?? new Date().toISOString(),
    riderName: update.riderName,
    riderPhone: update.riderPhone,
    riderRating: update.riderRating,
  });
}

function scheduleTrackingSimulation(orderId: string) {
  if (trackingTimers.has(orderId)) return;

  const timer = setInterval(() => {
    const order = orders.get(orderId);
    if (!order || order.status === "cancelled" || order.status === "delivered") {
      clearInterval(timer);
      trackingTimers.delete(orderId);
      return;
    }

    const status = deriveStatus(order);
    const tracking = enrichTracking(order);
    if (!tracking?.storeLat || !tracking?.storeLng || !tracking?.customerLat || !tracking?.customerLng) {
      return;
    }
    const store = { lat: tracking.storeLat, lng: tracking.storeLng };
    const customer = {
      lat: tracking.customerLat,
      lng: tracking.customerLng,
    };

    const elapsed = (Date.now() - new Date(order.placedAt).getTime()) / 1000;
    const transitProgress = Math.min(Math.max((elapsed - 55) / 65, 0), 1);

    let riderPoint = store;
    if (status === "picked" || status === "in_transit") {
      riderPoint = lerpPoint(store, customer, transitProgress);
    } else if (status === "assigned") {
      riderPoint = lerpPoint(store, store, 0.5);
    }

    const distanceKm = haversineKm(riderPoint, customer);
    const speed = 22 + Math.sin(elapsed / 8) * 8;
    const heading = bearingDegrees(riderPoint, customer);

    const updated: Order = {
      ...order,
      status,
      tracking: {
        ...tracking,
        riderLat: riderPoint.lat,
        riderLng: riderPoint.lng,
        riderSpeed: Math.round(speed),
        riderHeading: heading,
        distanceKm: Number(distanceKm.toFixed(2)),
        distanceRemainingM: Math.round(distanceKm * 1000),
        etaMinutes: estimateEtaMinutes(distanceKm, speed),
        updatedAt: new Date().toISOString(),
      },
    };

    orders.set(orderId, updated);
    broadcastTracking(updated);

    if (status === "delivered") {
      clearInterval(timer);
      trackingTimers.delete(orderId);
      void import("@/lib/referral")
        .then(({ onOrderDelivered }) => onOrderDelivered(updated))
        .catch((e) => console.error("referral on simulated delivery:", e));
    }
  }, 4000);

  trackingTimers.set(orderId, timer);
}

export function getOrder(id: string): Order | undefined {
  const order = orders.get(id);
  if (!order) return undefined;
  return {
    ...order,
    status: deriveStatus(order),
    tracking: enrichTracking({ ...order, status: deriveStatus(order) }),
  };
}

export function listOrders(): Order[] {
  return Array.from(orders.values())
    .map((o) => ({
      ...o,
      status: deriveStatus(o),
      tracking: enrichTracking({ ...o, status: deriveStatus(o) }),
    }))
    .sort(
      (a, b) =>
        new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    );
}

export function listActiveDeliveries(): Order[] {
  return listOrders().filter((o) =>
    ["assigned", "picked", "in_transit", "preparing", "packed"].includes(o.status)
  );
}
