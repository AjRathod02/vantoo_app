import type { Order, OrderStatus } from "@/lib/types";
import { hasAdminClient, createAdminClient } from "@/utils/supabase/admin";
import { isPlatformEnabled } from "@/lib/platform/client";
import {
  createPlatformOrder,
  listPlatformOrders,
  getPlatformOrder,
  cancelPlatformOrder,
} from "@/lib/platform/orders";
import { deriveLegacyStatus } from "@/lib/platform/legacy-orders";
import {
  getOrder as getMemoryOrder,
  listOrders as listMemoryOrders,
  saveOrder as saveMemoryOrder,
  updateOrderTracking as updateMemoryTracking,
} from "@/lib/server/orderStore";
import { normalizeStatus } from "@/lib/orderStatus";
import { customerCoordsFromPincode, DEFAULT_STORE } from "@/lib/tracking/geo";

type DbOrderRow = {
  id: string;
  user_id: string | null;
  items: Order["items"];
  subtotal: number;
  delivery_fee: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  payment_method: Order["paymentMethod"];
  payment_status: Order["paymentStatus"];
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  refund_status: Order["refundStatus"];
  refund_amount: number | null;
  address: Order["address"];
  service: Order["service"];
  rider_name: string | null;
  rider_phone: string | null;
  rider_lat: number | null;
  rider_lng: number | null;
  placed_at: string;
  cancelled_at: string | null;
};

function rowToOrder(row: DbOrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    items: row.items,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    tax: Number(row.tax),
    discount: Number(row.discount),
    total: Number(row.total),
    status: normalizeStatus(row.status),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status ?? "pending",
    razorpayOrderId: row.razorpay_order_id ?? undefined,
    razorpayPaymentId: row.razorpay_payment_id ?? undefined,
    refundStatus: row.refund_status ?? "none",
    refundAmount: row.refund_amount ? Number(row.refund_amount) : undefined,
    address: row.address,
    service: row.service,
    placedAt: row.placed_at,
    cancelledAt: row.cancelled_at ?? undefined,
    tracking: {
      riderName: row.rider_name ?? undefined,
      riderPhone: row.rider_phone ?? undefined,
      riderLat: row.rider_lat ? Number(row.rider_lat) : undefined,
      riderLng: row.rider_lng ? Number(row.rider_lng) : undefined,
    },
  };
}

function orderToRow(order: Order) {
  return {
    id: order.id,
    user_id: order.userId ?? null,
    items: order.items,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    tax: order.tax,
    discount: order.discount,
    total: order.total,
    status: order.status,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus ?? "pending",
    razorpay_order_id: order.razorpayOrderId ?? null,
    razorpay_payment_id: order.razorpayPaymentId ?? null,
    refund_status: order.refundStatus ?? "none",
    refund_amount: order.refundAmount ?? null,
    address: order.address,
    service: order.service,
    rider_name: order.tracking?.riderName ?? null,
    rider_phone: order.tracking?.riderPhone ?? null,
    rider_lat: order.tracking?.riderLat ?? null,
    rider_lng: order.tracking?.riderLng ?? null,
    placed_at: order.placedAt,
    cancelled_at: order.cancelledAt ?? null,
    updated_at: new Date().toISOString(),
  };
}

export async function saveOrder(order: Order) {
  if (isPlatformEnabled() && order.platformId) {
    return order;
  }

  saveMemoryOrder(order);

  if (!hasAdminClient()) return order;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("orders").upsert(orderToRow(order));
    if (error) console.error("Supabase saveOrder:", error.message);
  } catch (e) {
    console.error("Supabase saveOrder failed:", e);
  }

  return order;
}

export async function createOrder(
  userId: string,
  input: Parameters<typeof createPlatformOrder>[1]
): Promise<Order> {
  if (isPlatformEnabled()) {
    try {
      return await createPlatformOrder(userId, input);
    } catch (e) {
      console.error("Platform createOrder failed, falling back:", e);
    }
  }

  const id = `VT${Date.now().toString().slice(-8)}`;
  const customer = customerCoordsFromPincode(input.address.pincode);
  const order: Order = {
    id,
    userId,
    items: input.items,
    subtotal: input.items.reduce((s, i) => s + i.price * i.quantity, 0),
    deliveryFee: 40,
    tax: 0,
    discount: 0,
    total: input.items.reduce((s, i) => s + i.price * i.quantity, 0) + 40,
    status: "confirmed",
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === "cod" ? "pending" : (input.paymentStatus ?? "paid"),
    refundStatus: "none",
    address: input.address,
    placedAt: new Date().toISOString(),
    service: input.service,
    razorpayOrderId: input.razorpayOrderId,
    razorpayPaymentId: input.razorpayPaymentId,
    tracking: {
      riderName: "Rahul Sharma",
      riderPhone: "+91 98765 43210",
      riderRating: 4.9,
      storeName: "Vantoo Store",
      storeLat: DEFAULT_STORE.lat,
      storeLng: DEFAULT_STORE.lng,
      customerLat: customer.lat,
      customerLng: customer.lng,
      riderLat: DEFAULT_STORE.lat,
      riderLng: DEFAULT_STORE.lng,
    },
  };
  await saveOrder(order);
  return order;
}

export async function getOrder(id: string, userId?: string): Promise<Order | undefined> {
  if (isPlatformEnabled() && userId) {
    try {
      const order = await getPlatformOrder(userId, id);
      if (order) return order;
    } catch (e) {
      console.error("Platform getOrder failed, falling back:", e);
    }
  }

  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!error && data) {
        const order = rowToOrder(data as DbOrderRow);
        return { ...order, status: deriveLegacyStatus(order) };
      }
    } catch (e) {
      console.error("Supabase getOrder failed:", e);
    }
  }

  const memory = getMemoryOrder(id);
  if (memory) return { ...memory, status: deriveLegacyStatus(memory) };
  return undefined;
}

export async function listOrders(userId?: string): Promise<Order[]> {
  if (!userId) return [];

  if (isPlatformEnabled()) {
    try {
      return await listPlatformOrders(userId);
    } catch (e) {
      console.error("Platform listOrders failed, falling back:", e);
    }
  }

  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("placed_at", { ascending: false });

      if (!error && data) {
        return (data as DbOrderRow[]).map((row) => {
          const order = rowToOrder(row);
          return { ...order, status: deriveLegacyStatus(order) };
        });
      }
    } catch (e) {
      console.error("Supabase listOrders failed:", e);
    }
  }

  return listMemoryOrders()
    .filter((o) => o.userId === userId)
    .map((o) => ({ ...o, status: deriveLegacyStatus(o) }));
}

/** Admin-only: list all orders across customers. */
export async function listAllOrders(): Promise<Order[]> {
  if (isPlatformEnabled()) {
    try {
      const supabase = hasAdminClient() ? createAdminClient() : null;
      if (supabase) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("placed_at", { ascending: false });
        if (!error && data) {
          return (data as DbOrderRow[]).map((row) => {
            const order = rowToOrder(row);
            return { ...order, status: deriveLegacyStatus(order) };
          });
        }
      }
    } catch (e) {
      console.error("Platform listAllOrders failed:", e);
    }
  }

  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("placed_at", { ascending: false });

      if (!error && data) {
        return (data as DbOrderRow[]).map((row) => {
          const order = rowToOrder(row);
          return { ...order, status: deriveLegacyStatus(order) };
        });
      }
    } catch (e) {
      console.error("Supabase listAllOrders failed:", e);
    }
  }

  return listMemoryOrders().map((o) => ({ ...o, status: deriveLegacyStatus(o) }));
}

export async function cancelOrder(id: string, userId: string, reason?: string): Promise<Order | undefined> {
  if (isPlatformEnabled()) {
    try {
      return await cancelPlatformOrder(userId, id, reason);
    } catch (e) {
      console.error("Platform cancelOrder failed, falling back:", e);
    }
  }

  const existing = await getOrder(id, userId);
  if (!existing) return undefined;

  const updated: Order = {
    ...existing,
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
  };
  await saveOrder(updated);
  return updated;
}

export async function updateOrder(id: string, patch: Partial<Order>): Promise<Order | undefined> {
  const existing = await getOrder(id);
  if (!existing) return undefined;

  const updated: Order = {
    ...existing,
    ...patch,
    tracking: { ...existing.tracking, ...patch.tracking },
  };

  await saveOrder(updated);
  return updated;
}

export async function updateOrderTracking(
  id: string,
  tracking: Partial<Order["tracking"]>
) {
  updateMemoryTracking(id, tracking);
  if (!hasAdminClient()) return;

  try {
    const supabase = createAdminClient();
    await supabase
      .from("orders")
      .update({
        rider_name: tracking?.riderName ?? null,
        rider_phone: tracking?.riderPhone ?? null,
        rider_lat: tracking?.riderLat ?? null,
        rider_lng: tracking?.riderLng ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  } catch (e) {
    console.error("Supabase updateOrderTracking failed:", e);
  }
}
