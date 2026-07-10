import type { Address, PaymentMethod } from "@/lib/types";
import type { CartItem } from "@/lib/types";

export async function createVantooOrder(payload: Record<string, unknown>) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || "Failed to place order");
  }
  return res.json() as Promise<{ order: { id: string } }>;
}

export function buildOrderPayload({
  items,
  totals,
  payment,
  address,
  service,
  extra = {},
}: {
  items: CartItem[];
  totals: {
    subtotal: number;
    deliveryFee: number;
    tax: number;
    discount: number;
    total: number;
  };
  payment: PaymentMethod;
  address: Address;
  service: CartItem["product"]["service"];
  extra?: Record<string, unknown>;
}) {
  return {
    items: items.map((i) => ({
      productId: i.product.id,
      name: i.product.name,
      image: i.product.image,
      price: i.product.price,
      quantity: i.quantity,
    })),
    subtotal: totals.subtotal,
    deliveryFee: totals.deliveryFee,
    tax: totals.tax,
    discount: totals.discount,
    total: totals.total,
    paymentMethod: payment,
    address,
    service,
    ...extra,
  };
}
