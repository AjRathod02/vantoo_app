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

export function getTrackingSteps(): OrderStatus[] {
  return ["confirmed", "preparing", "packed", "in_transit", "delivered"];
}

export function getStepIndex(status: OrderStatus): number {
  const normalized = normalizeStatus(status);
  const steps = getTrackingSteps();
  if (normalized === "assigned" || normalized === "picked") return steps.indexOf("in_transit");
  const idx = steps.indexOf(normalized);
  return idx >= 0 ? idx : 0;
}
