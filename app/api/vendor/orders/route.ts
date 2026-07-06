import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { isPlatformEnabled } from "@/lib/platform/client";
import { listVendorOrders, updateVendorOrderStatus } from "@/lib/platform/vendors";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlatformEnabled()) return NextResponse.json({ orders: [] });

  try {
    const orders = await listVendorOrders(user.id);
    return NextResponse.json({ orders });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlatformEnabled()) {
    return NextResponse.json({ error: "Platform mode required" }, { status: 503 });
  }

  const body = await request.json();
  const { orderId, status } = body as { orderId: string; status: string };
  if (!orderId || !status) {
    return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
  }

  try {
    const result = await updateVendorOrderStatus(user.id, orderId, status);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
