import type { OrderStatus } from "@/lib/types";

export const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "packed",
  "assigned",
  "picked",
  "in_transit",
  "delivered",
];

export const statusMeta: Record<
  OrderStatus,
  { label: string; description: string; tone: "orange" | "green" | "red" | "gray" }
> = {
  pending: {
    label: "Pending",
    description: "Waiting for confirmation",
    tone: "gray",
  },
  confirmed: {
    label: "Order Confirmed",
    description: "We have received your order",
    tone: "orange",
  },
  preparing: {
    label: "Preparing",
    description: "Your order is being prepared",
    tone: "orange",
  },
  packed: {
    label: "Packed",
    description: "Your order has been packed",
    tone: "orange",
  },
  assigned: {
    label: "Rider Assigned",
    description: "A delivery partner has been assigned",
    tone: "orange",
  },
  picked: {
    label: "Picked Up",
    description: "Your order has been picked up",
    tone: "orange",
  },
  in_transit: {
    label: "Out for Delivery",
    description: "Your rider is on the way",
    tone: "orange",
  },
  delivered: {
    label: "Delivered",
    description: "Order delivered. Enjoy!",
    tone: "green",
  },
  cancelled: {
    label: "Cancelled",
    description: "This order was cancelled",
    tone: "red",
  },
  returned: {
    label: "Returned",
    description: "Order has been returned",
    tone: "red",
  },
  refunded: {
    label: "Refunded",
    description: "Refund has been processed",
    tone: "green",
  },
  exchanged: {
    label: "Exchanged",
    description: "Order has been exchanged",
    tone: "green",
  },
};

/** @deprecated Use in_transit — kept for backward compatibility */
export type LegacyOrderStatus = "out_for_delivery";

export function normalizeStatus(status: string): OrderStatus {
  if (status === "out_for_delivery") return "in_transit";
  return status as OrderStatus;
}

export function isOngoing(status: OrderStatus) {
  return !["delivered", "cancelled", "refunded", "exchanged", "returned"].includes(status);
}

export const TIMELINE_LABELS: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Vendor Accepted",
  preparing: "Food Preparation Started",
  packed: "Order Ready",
  assigned: "Rider Assigned",
  picked: "Rider Picked Up Order",
  in_transit: "Out for Delivery",
  delivered: "Delivered",
};

/** Approximate offsets (seconds) from placedAt when history timestamps are missing */
export const TIMELINE_OFFSETS: Record<string, number> = {
  pending: 0,
  confirmed: 0,
  preparing: 15,
  packed: 40,
  assigned: 30,
  picked: 45,
  in_transit: 55,
  delivered: 120,
};

export function buildOrderTimeline(
  status: OrderStatus,
  placedAt: string,
  statusHistory?: Array<{ status: OrderStatus; at: string }>,
  etaMinutes?: number
) {
  const steps = [
    "confirmed",
    "preparing",
    "packed",
    "assigned",
    "picked",
    "in_transit",
    "delivered",
  ] as OrderStatus[];

  const historyMap = new Map(
    (statusHistory ?? []).map((h) => [h.status, h.at])
  );
  const placed = new Date(placedAt).getTime();
  const currentIndex = getStepIndex(status);

  return steps.map((step, i) => {
    const done = status !== "cancelled" && i <= currentIndex;
    const at =
      historyMap.get(step) ??
      (done
        ? new Date(placed + (TIMELINE_OFFSETS[step] ?? 0) * 1000).toISOString()
        : null);
    return {
      status: step,
      label: TIMELINE_LABELS[step] ?? statusMeta[step].label,
      description: statusMeta[step].description,
      at,
      done,
      active: status !== "cancelled" && i === currentIndex,
      etaLabel:
        step === "in_transit" && etaMinutes != null && !done
          ? `ETA ~${etaMinutes} min`
          : step === "in_transit" && done
            ? "Arriving / arrived"
            : undefined,
    };
  });
}

export function getTrackingSteps(): OrderStatus[] {
  return [
    "confirmed",
    "preparing",
    "packed",
    "assigned",
    "picked",
    "in_transit",
    "delivered",
  ];
}

export function getStepIndex(status: OrderStatus): number {
  const normalized = normalizeStatus(status);
  const steps = getTrackingSteps();
  const idx = steps.indexOf(normalized);
  return idx >= 0 ? idx : 0;
}

export type MapTrackingPhase =
  | "confirmed"
  | "preparing"
  | "assigned"
  | "picked"
  | "near"
  | "delivered";

export function getMapTrackingPhase(status: OrderStatus): MapTrackingPhase {
  const normalized = normalizeStatus(status);
  if (normalized === "delivered") return "delivered";
  if (normalized === "in_transit") return "near";
  if (normalized === "picked") return "picked";
  if (normalized === "assigned") return "assigned";
  if (normalized === "preparing" || normalized === "packed") return "preparing";
  return "confirmed";
}

export const mapPhaseMeta: Record<
  MapTrackingPhase,
  { title: string; subtitle: string }
> = {
  confirmed: {
    title: "Order Confirmed",
    subtitle: "Your order has been received",
  },
  preparing: {
    title: "Preparing your order…",
    subtitle: "The store is packing your items",
  },
  assigned: {
    title: "Rider Assigned",
    subtitle: "A delivery partner is heading to the store",
  },
  picked: {
    title: "Order Picked Up",
    subtitle: "Your rider is on the way to you",
  },
  near: {
    title: "Rider is nearby",
    subtitle: "Your order will arrive shortly",
  },
  delivered: {
    title: "Delivered",
    subtitle: "Enjoy your order!",
  },
};
