import type { OrderStatus } from "@/lib/types";

export const STATUS_FLOW: OrderStatus[] = [
  "confirmed",
  "packed",
  "out_for_delivery",
  "delivered",
];

export const statusMeta: Record<
  OrderStatus,
  { label: string; description: string; tone: "orange" | "green" | "red" | "gray" }
> = {
  confirmed: {
    label: "Order Confirmed",
    description: "We have received your order",
    tone: "orange",
  },
  packed: {
    label: "Packed",
    description: "Your order has been packed",
    tone: "orange",
  },
  out_for_delivery: {
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
};

export function isOngoing(status: OrderStatus) {
  return status !== "delivered" && status !== "cancelled";
}
