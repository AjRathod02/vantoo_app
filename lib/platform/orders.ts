import type { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus, ServiceType } from "@/lib/types";
import { isPlatformEnabled, serviceFetch } from "./client";

interface PlatformOrder {
  id: string;
  orderNumber: string;
  userId: string;
  serviceType: ServiceType;
  status: OrderStatus;
  items: Array<{
    productId: string;
    variantId?: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  address: Order["address"];
  placedAt: string;
  cancelledAt: string | null;
  tracking?: Order["tracking"];
  statusHistory?: Array<{ toStatus: OrderStatus; createdAt: string }>;
}

function mapPaymentMethod(method: PaymentMethod): string {
  return method;
}

function toOrder(o: PlatformOrder): Order {
  return {
    id: o.orderNumber || o.id,
    platformId: o.id,
    userId: o.userId,
    items: o.items.map((i) => ({
      productId: i.productId,
      variantId: i.variantId,
      name: i.name,
      image: i.image,
      price: i.price,
      quantity: i.quantity,
    })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    tax: o.taxAmount,
    discount: o.discountAmount,
    total: o.totalAmount,
    status: o.status,
    paymentMethod: (o.paymentMethod ?? "cod") as PaymentMethod,
    paymentStatus: o.paymentStatus,
    address: o.address,
    placedAt: o.placedAt,
    cancelledAt: o.cancelledAt ?? undefined,
    service: o.serviceType,
    tracking: o.tracking,
    statusHistory: o.statusHistory?.map((h) => ({
      status: h.toStatus,
      at: h.createdAt,
    })),
  };
}

export async function createPlatformOrder(
  userId: string,
  input: {
    items: OrderItem[];
    service: ServiceType;
    address: Order["address"];
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    idempotencyKey?: string;
  }
): Promise<Order> {
  const order = await serviceFetch<PlatformOrder>("order", "/v1/orders", {
    method: "POST",
    userId,
    body: JSON.stringify({
      items: input.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
      serviceType: input.service,
      address: {
        label: input.address.label,
        line1: input.address.line1,
        line2: input.address.line2,
        city: input.address.city,
        pincode: input.address.pincode,
        isDefault: input.address.isDefault,
      },
      paymentMethod: mapPaymentMethod(input.paymentMethod),
      paymentStatus: input.paymentStatus,
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      idempotencyKey: input.idempotencyKey,
    }),
  });
  return toOrder(order);
}

export async function listPlatformOrders(userId: string): Promise<Order[]> {
  const orders = await serviceFetch<PlatformOrder[]>("order", "/v1/orders", { userId });
  return orders.map(toOrder);
}

export async function getPlatformOrder(userId: string, id: string): Promise<Order | undefined> {
  try {
    const order = await serviceFetch<PlatformOrder>("order", `/v1/orders/${encodeURIComponent(id)}`, { userId });
    return toOrder(order);
  } catch {
    return undefined;
  }
}

export async function cancelPlatformOrder(userId: string, id: string, reason?: string): Promise<Order> {
  const order = await serviceFetch<PlatformOrder>("order", `/v1/orders/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    userId,
    body: JSON.stringify({ reason }),
  });
  return toOrder(order);
}

export function usePlatformOrders(): boolean {
  return isPlatformEnabled();
}
