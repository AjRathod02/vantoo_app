import { NextResponse } from "next/server";
import { getRazorpay, isRazorpayConfigured } from "@/lib/razorpay";
import { getSessionUser } from "@/lib/server/auth";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: "Razorpay is not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");

  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  try {
    const razorpay = getRazorpay();
    const payments = await razorpay.orders.fetchPayments(orderId);
    const items = payments.items ?? [];

    if (paymentId) {
      const match = items.find((p) => p.id === paymentId);
      if (match?.status === "captured" && match.id) {
        return NextResponse.json({
          status: "captured",
          verified: true,
          razorpayOrderId: orderId,
          razorpayPaymentId: match.id,
        });
      }
    }

    const captured = items.find((p) => p.status === "captured");
    if (captured?.id) {
      return NextResponse.json({
        status: "captured",
        verified: true,
        razorpayOrderId: orderId,
        razorpayPaymentId: captured.id,
      });
    }

    const failed = items.find((p) => p.status === "failed");
    if (failed) {
      return NextResponse.json({
        status: "failed",
        verified: false,
        razorpayOrderId: orderId,
        failureReason:
          (failed.error_description as string | undefined) ||
          (failed.error_reason as string | undefined) ||
          "Payment failed",
      });
    }

    return NextResponse.json({
      status: "pending",
      verified: false,
      razorpayOrderId: orderId,
    });
  } catch (e) {
    console.error("Razorpay status check:", e);
    return NextResponse.json({ error: "Failed to check payment status" }, { status: 500 });
  }
}
