import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import { listAllOrders, updateOrder } from "@/lib/server/orders";
import { logAdminAction } from "@/lib/admin/audit";
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
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "refunds", "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { orderId, action, amount, reason } = await request.json();

    const patch: Partial<Order> = {};
    if (action === "approve") {
      patch.refundStatus = "processing";
      patch.refundAmount = amount;
    } else if (action === "complete") {
      patch.refundStatus = "completed";
      patch.paymentStatus = "refunded";
    } else if (action === "reject") {
      patch.refundStatus = "none";
    } else if (action === "partial") {
      patch.refundStatus = "processing";
      patch.refundAmount = amount;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const order = await updateOrder(orderId, patch);

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action,
      resource: "refunds",
      resourceId: orderId,
      details: { amount, reason },
    });

    return NextResponse.json({ order });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
