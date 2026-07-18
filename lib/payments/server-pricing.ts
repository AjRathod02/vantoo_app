import { getProduct } from "@/lib/server/products";
import { DELIVERY_FEE, TAX_RATE } from "@/lib/commerce/constants";
import type { Order } from "@/lib/types";

export type PricedOrderItem = Order["items"][number];

export async function priceOrderItems(
  items: Array<{ productId: string; quantity: number; variantId?: string }>,
  opts?: { discount?: number }
): Promise<{
  items: PricedOrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
}> {
  if (!items.length) {
    throw new Error("Cart is empty");
  }

  const priced: PricedOrderItem[] = [];
  for (const item of items) {
    const qty = Math.floor(Number(item.quantity));
    if (!item.productId || !Number.isFinite(qty) || qty < 1) {
      throw new Error("Invalid cart item");
    }
    const product = await getProduct(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    if (product.inStock === false) {
      throw new Error(`${product.name} is out of stock`);
    }
    priced.push({
      productId: product.id,
      variantId: item.variantId,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: qty,
    });
  }

  const subtotal = priced.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = Math.max(
    0,
    Math.min(Math.round(opts?.discount ?? 0), Math.round(subtotal))
  );
  const taxable = Math.max(subtotal - discount, 0);
  const tax = Math.round(taxable * TAX_RATE);
  const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0;
  const total = taxable + tax + deliveryFee;

  return { items: priced, subtotal, deliveryFee, tax, discount, total };
}
