import type { Order, OrderStatus } from "@/lib/types";

/**
 * In-memory order store for the demo. Orders live for the lifetime of the
 * server process. The `globalThis` cache keeps a single instance across
 * Next.js dev hot-reloads.
 */
const globalForOrders = globalThis as unknown as {
  vantooOrders?: Map<string, Order>;
};

const orders = globalForOrders.vantooOrders ?? new Map<string, Order>();
if (process.env.NODE_ENV !== "production") {
  globalForOrders.vantooOrders = orders;
}

// Compressed demo timeline (seconds since order placed).
const STAGE_SCHEDULE: { status: OrderStatus; afterSeconds: number }[] = [
  { status: "confirmed", afterSeconds: 0 },
  { status: "packed", afterSeconds: 20 },
  { status: "out_for_delivery", afterSeconds: 45 },
  { status: "delivered", afterSeconds: 80 },
];

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
  orders.set(order.id, order);
}

export function getOrder(id: string): Order | undefined {
  const order = orders.get(id);
  if (!order) return undefined;
  return { ...order, status: deriveStatus(order) };
}

export function listOrders(): Order[] {
  return Array.from(orders.values())
    .map((o) => ({ ...o, status: deriveStatus(o) }))
    .sort(
      (a, b) =>
        new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    );
}
