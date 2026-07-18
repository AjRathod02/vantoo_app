import { NextResponse } from "next/server";
import { requireAdminAuth, adminErrorResponse } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import { getOrder, listAllOrders, updateOrder } from "@/lib/server/orders";
import { logAdminAction } from "@/lib/admin/audit";
import { getRazorpay, isRazorpayConfigured } from "@/lib/razorpay";
import type { Order } from "@/lib/types";

export async function GET() {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "refunds", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orders = await listAllOrders();
    const refunds = orders.filter(
      (o) => o.refundStatus && o.refundStatus !== "none"
    );

    return NextResponse.json({ refunds });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "refunds", "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, action, amount, reason } = body as {
      orderId?: string;
      action?: string;
      amount?: number;
      reason?: string;
    };

    if (!orderId || !action) {
      return NextResponse.json(
        { error: "orderId and action are required" },
        { status: 400 }
      );
    }

    const existing = await getOrder(orderId);
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const maxRefund = existing.total;
    const refundAmount =
      typeof amount === "number" && Number.isFinite(amount) ? amount : maxRefund;

    if (refundAmount <= 0 || refundAmount > maxRefund) {
      return NextResponse.json(
        { error: `Refund amount must be between 0 and ${maxRefund}` },
        { status: 400 }
      );
    }

    const patch: Partial<Order> = {};
    if (action === "approve" || action === "partial") {
      patch.refundStatus = "processing";
      patch.refundAmount = refundAmount;
    } else if (action === "complete") {
      if (
        existing.razorpayPaymentId &&
        isRazorpayConfigured() &&
        existing.paymentStatus === "paid"
      ) {
        try {
          const razorpay = getRazorpay();
          await razorpay.payments.refund(existing.razorpayPaymentId, {
            amount: Math.round(refundAmount * 100),
            notes: {
              orderId,
              reason: reason || "Admin refund",
              adminId: ctx.admin.id,
            },
          });
        } catch (e) {
          console.error("Razorpay refund failed:", e);
          return NextResponse.json(
            {
              error:
                e instanceof Error
                  ? e.message
                  : "Razorpay refund failed — order status not updated",
            },
            { status: 502 }
          );
        }
      }
      patch.refundStatus = "completed";
      patch.refundAmount = refundAmount;
      patch.paymentStatus = "refunded";
    } else if (action === "reject") {
      patch.refundStatus = "none";
      patch.refundAmount = undefined;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const order = await updateOrder(orderId, patch);
    if (!order) {
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action,
      resource: "refunds",
      resourceId: orderId,
      details: { amount: refundAmount, reason },
    });

    return NextResponse.json({ order });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
