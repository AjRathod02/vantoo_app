import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getOrder } from "@/lib/server/orders";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  const order = await getOrder(params.id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.userId && user?.id !== order.userId && user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ order });
}
