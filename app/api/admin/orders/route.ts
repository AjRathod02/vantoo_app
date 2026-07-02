import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { listOrders } from "@/lib/server/orders";

export async function GET() {
  try {
    await requireAdmin();
    const orders = await listOrders();
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
