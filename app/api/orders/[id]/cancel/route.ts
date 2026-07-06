import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getOrder, cancelOrder } from "@/lib/server/orders";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await getOrder(params.id, user.id);
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

  try {
    const updated = await cancelOrder(params.id, user.id);
    return NextResponse.json({ order: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to cancel order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
