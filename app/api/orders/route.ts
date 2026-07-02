import { NextResponse } from "next/server";
import { z } from "zod";
import type { Order } from "@/lib/types";
import { getSessionUser } from "@/lib/server/auth";
import { listOrders, saveOrder } from "@/lib/server/orders";

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
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  address: addressSchema,
  service: z.enum(["food", "grocery", "medicine", "ecommerce"]),
});

export async function GET() {
  const user = await getSessionUser();
  const orders = await listOrders(user?.id);
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid order", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { paymentMethod, paymentStatus, razorpayOrderId, razorpayPaymentId } =
    parsed.data;

  if (paymentMethod !== "cod" && paymentStatus !== "paid") {
    return NextResponse.json(
      { error: "Payment verification required for online payments" },
      { status: 400 }
    );
  }

  const id = `VT${Date.now().toString().slice(-8)}`;
  const order: Order = {
    id,
    userId: user.id,
    ...parsed.data,
    status: "confirmed",
    paymentStatus:
      paymentMethod === "cod" ? "pending" : paymentStatus ?? "paid",
    refundStatus: "none",
    placedAt: new Date().toISOString(),
    tracking: {
      riderName: "Rajesh Kumar",
      riderPhone: "+91 98765 43210",
      riderLat: 12.9716,
      riderLng: 77.5946,
    },
    razorpayOrderId,
    razorpayPaymentId,
  };

  await saveOrder(order);
  return NextResponse.json({ order }, { status: 201 });
}
