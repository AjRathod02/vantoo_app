import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { listAllOrders } from "@/lib/server/orders";
import { listActiveDeliveries } from "@/lib/server/orderStore";

export async function GET() {
  const user = await getSessionUser();
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const memoryActive = listActiveDeliveries();
  if (memoryActive.length > 0) {
    return NextResponse.json({ orders: memoryActive });
  }

  const orders = await listAllOrders();
  const active = orders.filter((o) =>
    ["assigned", "picked", "in_transit", "preparing", "packed"].includes(
      o.status
    )
  );

  return NextResponse.json({ orders: active });
}
