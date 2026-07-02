import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getOrder, updateOrder } from "@/lib/server/orders";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await getOrder(params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.userId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status === "delivered" || order.status === "cancelled") {
    return NextResponse.json(
      { error: "Order cannot be cancelled" },
      { status: 400 }
    );
  }

  const updated = await updateOrder(params.id, {
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    refundStatus:
      order.paymentStatus === "paid" ? "requested" : order.refundStatus,
    refundAmount:
      order.paymentStatus === "paid" ? order.total : order.refundAmount,
  });

  return NextResponse.json({ order: updated });
}
