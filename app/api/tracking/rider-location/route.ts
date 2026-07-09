import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { getOrder, updateOrderTracking } from "@/lib/server/orders";
import {
  applyRiderLocationUpdate,
  getOrder as getMemoryOrder,
} from "@/lib/server/orderStore";
import { isPlatformEnabled, getServiceUrl } from "@/lib/platform/client";
import {
  bearingDegrees,
  estimateEtaMinutes,
  haversineKm,
} from "@/lib/tracking/geo";

const bodySchema = z.object({
  orderId: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  timestamp: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  const body = bodySchema.parse(await request.json());

  const order = (await getOrder(body.orderId)) ?? getMemoryOrder(body.orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (
    user?.role !== "admin" &&
    user?.id !== order.userId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customer = {
    lat: order.tracking?.customerLat ?? body.lat,
    lng: order.tracking?.customerLng ?? body.lng,
  };
  const rider = { lat: body.lat, lng: body.lng };
  const distanceKm = haversineKm(rider, customer);
  const speed = body.speed ?? 25;
  const heading = body.heading ?? bearingDegrees(rider, customer);

  const payload = {
    lat: body.lat,
    lng: body.lng,
    speed,
    heading,
    timestamp: body.timestamp ?? new Date().toISOString(),
    distanceKm: Number(distanceKm.toFixed(2)),
    distanceRemainingM: Math.round(distanceKm * 1000),
    etaMinutes: estimateEtaMinutes(distanceKm, speed),
    riderName: order.tracking?.riderName,
    riderPhone: order.tracking?.riderPhone,
    riderRating: order.tracking?.riderRating,
  };

  applyRiderLocationUpdate(body.orderId, payload);
  await updateOrderTracking(body.orderId, {
    riderLat: payload.lat,
    riderLng: payload.lng,
    riderSpeed: payload.speed,
    riderHeading: payload.heading,
    distanceKm: payload.distanceKm,
    distanceRemainingM: payload.distanceRemainingM,
    etaMinutes: payload.etaMinutes,
    updatedAt: payload.timestamp,
  });

  if (isPlatformEnabled()) {
    try {
      await fetch(
        `${getServiceUrl("tracking")}/v1/tracking/orders/${encodeURIComponent(body.orderId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY ?? "",
          },
          body: JSON.stringify({
            riderId: user?.id ?? "00000000-0000-4000-8000-000000000001",
            riderName: order.tracking?.riderName ?? "Rider",
            riderPhone: order.tracking?.riderPhone ?? "",
            latitude: body.lat,
            longitude: body.lng,
            speed,
            heading,
          }),
        }
      );
    } catch {
      // platform sync is best-effort
    }
  }

  return NextResponse.json({ ok: true, tracking: payload });
}
