import { NextResponse } from "next/server";
import { getOrder } from "@/lib/server/orderStore";

export function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const order = getOrder(params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}
