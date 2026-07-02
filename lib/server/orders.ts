import type { Order, OrderStatus } from "@/lib/types";
import { hasAdminClient, createAdminClient } from "@/utils/supabase/admin";
import {
  deriveStatus,
  getOrder as getMemoryOrder,
  listOrders as listMemoryOrders,
  saveOrder as saveMemoryOrder,
  updateOrderTracking as updateMemoryTracking,
} from "@/lib/server/orderStore";

type DbOrderRow = {
  id: string;
  user_id: string | null;
  items: Order["items"];
  subtotal: number;
  delivery_fee: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
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
    status: row.status,
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

export async function getOrder(id: string): Promise<Order | undefined> {
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
        return { ...order, status: deriveStatus(order) };
      }
    } catch (e) {
      console.error("Supabase getOrder failed:", e);
    }
  }

  return getMemoryOrder(id);
}

export async function listOrders(userId?: string): Promise<Order[]> {
  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      let query = supabase.from("orders").select("*").order("placed_at", {
        ascending: false,
      });
      if (userId) query = query.eq("user_id", userId);

      const { data, error } = await query;
      if (!error && data) {
        return (data as DbOrderRow[]).map((row) => {
          const order = rowToOrder(row);
          return { ...order, status: deriveStatus(order) };
        });
      }
    } catch (e) {
      console.error("Supabase listOrders failed:", e);
    }
  }

  const orders = listMemoryOrders();
  return userId ? orders.filter((o) => o.userId === userId) : orders;
}

export async function updateOrder(
  id: string,
  patch: Partial<Order>
): Promise<Order | undefined> {
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
  tracking: Order["tracking"]
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
