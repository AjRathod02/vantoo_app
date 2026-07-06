import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { listOrders, createOrder } from "@/lib/server/orders";

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
        variantId: z.string().optional(),
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
  idempotencyKey: z.string().optional(),
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

  const { paymentMethod, paymentStatus, razorpayOrderId, razorpayPaymentId, idempotencyKey } =
    parsed.data;

  if (paymentMethod !== "cod" && paymentStatus !== "paid") {
    return NextResponse.json(
      { error: "Payment verification required for online payments" },
      { status: 400 }
    );
  }

  try {
    const order = await createOrder(user.id, {
      items: parsed.data.items,
      service: parsed.data.service,
      address: parsed.data.address,
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : paymentStatus ?? "paid",
      razorpayOrderId,
      razorpayPaymentId,
      idempotencyKey,
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
