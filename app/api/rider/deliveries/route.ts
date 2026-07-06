import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { isPlatformEnabled } from "@/lib/platform/client";
import { listAvailableDeliveries, listRiderDeliveries, acceptDelivery, updateRiderDeliveryStatus } from "@/lib/platform/riders";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlatformEnabled()) return NextResponse.json({ deliveries: [], available: [] });

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  try {
    if (mode === "available") {
      const available = await listAvailableDeliveries(user.id);
      return NextResponse.json({ available });
    }
    const active = searchParams.get("active") === "true";
    const deliveries = await listRiderDeliveries(user.id, active);
    return NextResponse.json({ deliveries });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlatformEnabled()) {
    return NextResponse.json({ error: "Platform mode required" }, { status: 503 });
  }
  try {
    const { orderId } = await request.json();
    const task = await acceptDelivery(user.id, orderId);
    return NextResponse.json({ task }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlatformEnabled()) {
    return NextResponse.json({ error: "Platform mode required" }, { status: 503 });
  }
  try {
    const { orderId, status } = await request.json();
    const result = await updateRiderDeliveryStatus(user.id, orderId, status);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
