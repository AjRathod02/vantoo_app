import { NextResponse } from "next/server";
import crypto from "crypto";
import { getRazorpay, isRazorpayConfigured } from "@/lib/razorpay";
import {
  findOrderByRazorpayPaymentId,
} from "@/lib/payments/verify-payment";
import { hasAdminClient, createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Razorpay webhook for payment.captured / payment.failed / refund.processed.
 * Configure RAZORPAY_WEBHOOK_SECRET and point Razorpay dashboard to this URL.
 */
export async function POST(request: Request) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  // Require webhook secret in production; allow unsigned in development only
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (secret) {
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "RAZORPAY_WEBHOOK_SECRET is required in production" },
      { status: 503 }
    );
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: Record<string, unknown> };
      refund?: { entity?: Record<string, unknown> };
    };
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = event.event ?? "";
  const payment = event.payload?.payment?.entity;
  const refund = event.payload?.refund?.entity;

  try {
    if (eventName === "payment.captured" && payment?.id) {
      const paymentId = String(payment.id);
      const existing = await findOrderByRazorpayPaymentId(paymentId);
      if (existing && hasAdminClient()) {
        const supabase = createAdminClient();
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .neq("payment_status", "refunded");
      }
      // If no local order yet, client still creates it after verify — nothing to do.
    }

    if (eventName === "payment.failed" && payment?.id && hasAdminClient()) {
      const orderId = payment.order_id ? String(payment.order_id) : null;
      if (orderId) {
        const supabase = createAdminClient();
        await supabase
          .from("orders")
          .update({
            payment_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", orderId)
          .eq("payment_status", "pending");
      }
    }

    if (eventName === "refund.processed" && refund?.payment_id && hasAdminClient()) {
      const paymentId = String(refund.payment_id);
      const existing = await findOrderByRazorpayPaymentId(paymentId);
      if (existing) {
        const supabase = createAdminClient();
        await supabase
          .from("orders")
          .update({
            payment_status: "refunded",
            refund_status: "completed",
            refund_amount: refund.amount
              ? Number(refund.amount) / 100
              : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      }
    }

    // Touch Razorpay client so misconfig surfaces in logs during health checks
    if (eventName === "ping") {
      getRazorpay();
    }

    return NextResponse.json({ received: true, event: eventName });
  } catch (e) {
    console.error("Razorpay webhook handler:", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
