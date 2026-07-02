import { NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpay, isRazorpayConfigured, getRazorpayKeyId } from "@/lib/razorpay";
import { getSessionUser } from "@/lib/server/auth";

const schema = z.object({
  amount: z.number().min(1),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { error: "Razorpay is not configured" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: Math.round(parsed.data.amount * 100),
      currency: "INR",
      receipt: `vantoo_${Date.now()}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
    });
  } catch (e) {
    console.error("Razorpay create order:", e);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
