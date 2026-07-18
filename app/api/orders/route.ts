import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { listOrders, createOrder } from "@/lib/server/orders";
import { priceOrderItems } from "@/lib/payments/server-pricing";
import { verifyCapturedRazorpayPayment } from "@/lib/payments/verify-payment";

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
        name: z.string().optional(),
        image: z.string().optional(),
        price: z.number().optional(),
        quantity: z.number().min(1),
      })
    )
    .min(1),
  subtotal: z.number().optional(),
  deliveryFee: z.number().optional(),
  tax: z.number().optional(),
  discount: z.number().optional(),
  total: z.number().optional(),
  paymentMethod: z.enum(["card", "netbanking", "upi", "cod"]),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
  address: addressSchema,
  service: z.enum(["food", "grocery", "medicine", "ecommerce", "local_shop"]),
  idempotencyKey: z.string().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const orders = await listOrders(user.id);
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

  const {
    paymentMethod,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    idempotencyKey,
  } = parsed.data;

  let priced;
  try {
    priced = await priceOrderItems(
      parsed.data.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        variantId: i.variantId,
      }))
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unable to price order" },
      { status: 400 }
    );
  }

  let paymentStatus: "pending" | "paid" = "pending";

  if (paymentMethod === "cod") {
    paymentStatus = "pending";
  } else {
    if (!razorpayOrderId || !razorpayPaymentId) {
      return NextResponse.json(
        { error: "Payment verification required for online payments" },
        { status: 400 }
      );
    }

    try {
      await verifyCapturedRazorpayPayment({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        expectedAmountInr: priced.total,
        userId: user.id,
      });
      paymentStatus = "paid";
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Payment verification failed" },
        { status: 400 }
      );
    }
  }

  try {
    const order = await createOrder(user.id, {
      items: priced.items,
      service: parsed.data.service,
      address: parsed.data.address,
      paymentMethod,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId,
      idempotencyKey,
      // Server-authoritative totals (platform path may recompute)
      subtotal: priced.subtotal,
      deliveryFee: priced.deliveryFee,
      tax: priced.tax,
      discount: priced.discount,
      total: priced.total,
    } as Parameters<typeof createOrder>[1]);
    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
