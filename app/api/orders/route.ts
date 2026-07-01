import { NextResponse } from "next/server";
import { z } from "zod";
import type { Order } from "@/lib/types";
import { listOrders, saveOrder } from "@/lib/server/orderStore";

const addressSchema = z.object({
  id: z.string(),
  label: z.string(),
  line1: z.string(),
  line2: z.string(),
  city: z.string(),
  pincode: z.string(),
  isDefault: z.boolean().optional(),
});

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        name: z.string(),
        image: z.string(),
        price: z.number(),
        quantity: z.number().min(1),
      })
    )
    .min(1),
  subtotal: z.number(),
  deliveryFee: z.number(),
  tax: z.number(),
  discount: z.number(),
  total: z.number(),
  paymentMethod: z.enum(["card", "netbanking", "upi", "cod"]),
  address: addressSchema,
  service: z.enum(["food", "grocery", "medicine", "ecommerce"]),
});

export function GET() {
  return NextResponse.json({ orders: listOrders() });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid order", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const id = `VT${Date.now().toString().slice(-8)}`;
  const order: Order = {
    id,
    ...parsed.data,
    status: "confirmed",
    placedAt: new Date().toISOString(),
  };
  saveOrder(order);

  return NextResponse.json({ order }, { status: 201 });
}
