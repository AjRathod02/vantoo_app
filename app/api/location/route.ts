import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import {
  deviceToRecord,
  getUserLocation,
  upsertUserLocation,
} from "@/lib/server/userLocations";
import type { LocationRole } from "@/lib/types";

const bodySchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  altitude: z.number().optional(),
  timestamp: z.string().optional(),
  role: z.enum(["customer", "rider", "vendor", "admin"]).optional(),
  online: z.boolean().optional(),
  orderId: z.string().optional(),
  city: z.string().optional(),
});

function resolveRole(
  requested: LocationRole | undefined,
  sessionRole?: string,
  headerRole?: string | null
): LocationRole {
  if (requested === "admin" && sessionRole === "admin") return "admin";
  if (requested === "rider") return "rider";
  if (requested === "vendor") return "vendor";
  if (headerRole === "rider" || headerRole === "vendor") return headerRole;
  return "customer";
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = bodySchema.parse(await request.json());
  const portalRole = request.headers.get("x-vantoo-portal") as LocationRole | null;
  const role = resolveRole(body.role, user.role, portalRole);

  const record = upsertUserLocation(
    deviceToRecord(
      user.id,
      role,
      {
        latitude: body.latitude,
        longitude: body.longitude,
        accuracy: body.accuracy,
        speed: body.speed,
        heading: body.heading,
        altitude: body.altitude,
        timestamp: body.timestamp ?? new Date().toISOString(),
      },
      {
        name: user.name,
        online: body.online ?? true,
        orderId: body.orderId,
        city: body.city,
      }
    )
  );

  return NextResponse.json({ ok: true, location: record });
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? user.id;

  if (userId !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const location = getUserLocation(userId);
  return NextResponse.json({ location });
}
