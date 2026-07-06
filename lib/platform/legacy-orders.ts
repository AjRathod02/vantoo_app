import type { Order } from "@/lib/types";

/** Derive display status for legacy in-memory orders (demo simulation) */
export function deriveLegacyStatus(order: Order): Order["status"] {
  if (order.status === "cancelled" || order.status === "delivered") return order.status;

  const placed = new Date(order.placedAt).getTime();
  const elapsed = Date.now() - placed;
  const stages: Order["status"][] = [
    "confirmed",
    "preparing",
    "packed",
    "in_transit",
    "delivered",
  ];
  const idx = Math.min(Math.floor(elapsed / 80_000), stages.length - 1);
  return stages[idx];
}
