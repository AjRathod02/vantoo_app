import { NextResponse } from "next/server";
import { requireAdminAuth, adminErrorResponse } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import { listAllOrders } from "@/lib/server/orders";

export async function GET() {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "payments", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const orders = await listAllOrders();
    const paidOrders = orders.filter(
      (o) => o.paymentStatus === "paid" || o.paymentMethod === "cod"
    );

    const byMethod = new Map<string, { count: number; total: number }>();
    for (const o of paidOrders) {
      const m = o.paymentMethod;
      const cur = byMethod.get(m) ?? { count: 0, total: 0 };
      byMethod.set(m, { count: cur.count + 1, total: cur.total + o.total });
    }

    const failedPayments = orders.filter((o) => o.paymentStatus === "failed");
    const pendingPayouts = orders.filter(
      (o) => o.status === "delivered" && o.paymentStatus === "paid"
    );

    return NextResponse.json({
      summary: {
        totalRevenue: paidOrders.reduce((s, o) => s + o.total, 0),
        totalTransactions: paidOrders.length,
        failedPayments: failedPayments.length,
        pendingPayouts: pendingPayouts.length,
        vendorEarnings: paidOrders.reduce((s, o) => s + o.subtotal * 0.85, 0),
        riderEarnings: paidOrders.filter((o) => o.status === "delivered").length * 50,
        commissionRevenue: paidOrders.reduce((s, o) => s + o.subtotal * 0.15, 0),
      },
      byMethod: [...byMethod.entries()].map(([method, data]) => ({
        method,
        ...data,
      })),
      recentTransactions: paidOrders.slice(0, 50).map((o) => ({
        orderId: o.id,
        amount: o.total,
        method: o.paymentMethod,
        status: o.paymentStatus,
        razorpayPaymentId: o.razorpayPaymentId,
        placedAt: o.placedAt,
      })),
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
