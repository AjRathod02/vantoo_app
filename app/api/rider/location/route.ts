import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { isPlatformEnabled } from "@/lib/platform/client";
import { updateRiderLocation, getRiderMe } from "@/lib/platform/riders";
import { getOrder, updateOrderTracking } from "@/lib/server/orders";
import { applyRiderLocationUpdate } from "@/lib/server/orderStore";
import {
  bearingDegrees,
  estimateEtaMinutes,
  haversineKm,
} from "@/lib/tracking/geo";

const bodySchema = z.object({
  orderId: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  timestamp: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const lat = body.lat ?? body.latitude;
  const lng = body.lng ?? body.longitude;

  if (lat == null || lng == null) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  // When attaching location to an order, require an approved rider (platform) or admin.
  if (body.orderId) {
    if (user.role !== "admin") {
      if (!isPlatformEnabled()) {
        return NextResponse.json(
          { error: "Rider location updates require platform mode" },
          { status: 503 }
        );
      }
      try {
        const me = await getRiderMe(user.id);
        if (!me.rider || me.rider.status !== "approved") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const order = await getOrder(body.orderId);
    if (order) {
      const customer = {
        lat: order.tracking?.customerLat ?? lat,
        lng: order.tracking?.customerLng ?? lng,
      };
      const rider = { lat, lng };
      const distanceKm = haversineKm(rider, customer);
      const speed = body.speed ?? 25;

      const payload = {
        lat,
        lng,
        speed,
        heading: body.heading ?? bearingDegrees(rider, customer),
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
        riderLat: lat,
        riderLng: lng,
        riderSpeed: payload.speed,
        riderHeading: payload.heading,
        distanceKm: payload.distanceKm,
        distanceRemainingM: payload.distanceRemainingM,
        etaMinutes: payload.etaMinutes,
        updatedAt: payload.timestamp,
      });
    }
  }

  if (isPlatformEnabled()) {
    try {
      const location = await updateRiderLocation(user.id, {
        latitude: lat,
        longitude: lng,
        orderId: body.orderId,
      });
      return NextResponse.json({ location, ok: true });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
