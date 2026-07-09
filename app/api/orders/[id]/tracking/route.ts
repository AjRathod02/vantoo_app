import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getOrder } from "@/lib/server/orders";
import { getOrderTracking } from "@/lib/platform/tracking";
import { isPlatformEnabled } from "@/lib/platform/client";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  const order = await getOrder(params.id, user?.id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.userId && user?.id !== order.userId && user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isPlatformEnabled()) {
    return NextResponse.json({ tracking: order.tracking ?? null });
  }

  const orderId = order.platformId ?? params.id;
  const tracking = await getOrderTracking(orderId);
  if (!tracking) {
    return NextResponse.json({ tracking: order.tracking ?? null });
  }

  return NextResponse.json({
    tracking: {
      riderName: tracking.riderName,
      riderPhone: tracking.riderPhone,
      riderRating: tracking.riderRating,
      riderLat: tracking.latitude ?? tracking.riderLat,
      riderLng: tracking.longitude ?? tracking.riderLng,
      riderSpeed: tracking.speed ?? tracking.riderSpeed,
      riderHeading: tracking.heading ?? tracking.riderHeading,
      storeLat: tracking.storeLat,
      storeLng: tracking.storeLng,
      storeName: tracking.storeName,
      customerLat: tracking.customerLat,
      customerLng: tracking.customerLng,
      etaMinutes: tracking.etaMinutes,
      distanceKm: tracking.distanceKm,
      distanceRemainingM: tracking.distanceRemainingM,
      updatedAt: tracking.updatedAt,
    },
  });
}
