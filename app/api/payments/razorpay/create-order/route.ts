import { NextResponse } from "next/server";
import { z } from "zod";
import { getRazorpay, isRazorpayConfigured, getRazorpayKeyId } from "@/lib/razorpay";
import { getSessionUser } from "@/lib/server/auth";
import { priceOrderItems } from "@/lib/payments/server-pricing";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        variantId: z.string().optional(),
      })
    )
    .min(1),
  /** @deprecated Client amount is ignored; kept for backward compatibility. */
  amount: z.number().min(1).optional(),
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
    return NextResponse.json(
      { error: "Invalid cart", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let priced;
  try {
    priced = await priceOrderItems(parsed.data.items);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unable to price cart" },
      { status: 400 }
    );
  }

  if (priced.total < 1) {
    return NextResponse.json({ error: "Order total too low" }, { status: 400 });
  }

  try {
    const razorpay = getRazorpay();
    const amountPaise = Math.round(priced.total * 100);
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `vantoo_${Date.now()}`,
      notes: {
        userId: user.id,
        expectedAmountInr: String(priced.total),
        itemCount: String(priced.items.length),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      serverTotal: priced.total,
    });
  } catch (e) {
    console.error("Razorpay create order:", e);
    const rzpError = e as {
      statusCode?: number;
      error?: { description?: string; code?: string };
    };
    const description = rzpError.error?.description;
    const isAuthFailure =
      rzpError.statusCode === 401 ||
      description?.toLowerCase().includes("authentication");

    return NextResponse.json(
      {
        error: isAuthFailure
          ? "Razorpay authentication failed. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
          : description || "Failed to create payment order",
      },
      { status: isAuthFailure ? 502 : 500 }
    );
  }
}
