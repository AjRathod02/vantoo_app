import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { listAllOrders } from "@/lib/server/orders";

export async function GET() {
  try {
    await requireAdmin();
    const orders = await listAllOrders();
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
