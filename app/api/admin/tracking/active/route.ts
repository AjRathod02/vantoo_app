import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin/auth";
import { canRead } from "@/lib/admin/rbac";
import { listAllOrders } from "@/lib/server/orders";
import { listActiveDeliveries } from "@/lib/server/orderStore";

export async function GET() {
  try {
    const ctx = await requireAdminAuth();
    if (!canRead(ctx.permissions, "tracking")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
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
