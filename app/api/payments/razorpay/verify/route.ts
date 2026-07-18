import { NextResponse } from "next/server";
import { z } from "zod";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { getSessionUser } from "@/lib/server/auth";
import {
  assertPaymentUnused,
  verifyCapturedRazorpayPayment,
  verifyRazorpaySignatureSafe,
} from "@/lib/payments/verify-payment";

const schema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  expectedAmount: z.number().positive().optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "Razorpay is not configured" }, { status: 503 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    expectedAmount,
  } = parsed.data;

  if (
    !verifyRazorpaySignatureSafe(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )
  ) {
    return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
  }

  try {
    await assertPaymentUnused(razorpay_payment_id);

    if (expectedAmount != null) {
      await verifyCapturedRazorpayPayment({
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        expectedAmountInr: expectedAmount,
        userId: user.id,
      });
    }

    return NextResponse.json({
      verified: true,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed" },
      { status: 400 }
    );
  }
}
