import { NextResponse } from "next/server";
import { z } from "zod";
import { decodePolyline } from "@/lib/tracking/geo";

const querySchema = z.object({
  origin: z.string(),
  destination: z.string(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    origin: searchParams.get("origin"),
    destination: searchParams.get("destination"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return getOsrmRoute(parsed.data.origin, parsed.data.destination);
  }

  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", parsed.data.origin);
  url.searchParams.set("destination", parsed.data.destination);
  url.searchParams.set("departure_time", "now");
  url.searchParams.set("traffic_model", "best_guess");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 30 } });
  const json = await res.json();

  const route = json.routes?.[0];
  const leg = route?.legs?.[0];
  if (!route || !leg) {
    return NextResponse.json({ path: [], fallback: true });
  }

  const path = route.overview_polyline?.points
    ? decodePolyline(route.overview_polyline.points)
    : [];

  const durationSeconds =
    leg.duration_in_traffic?.value ?? leg.duration?.value ?? null;
  const distanceMeters = leg.distance?.value ?? null;

  return NextResponse.json({
    path,
    durationMinutes: durationSeconds
      ? Math.ceil(durationSeconds / 60)
      : null,
    distanceKm: distanceMeters
      ? Number((distanceMeters / 1000).toFixed(2))
      : null,
    fallback: false,
  });
}

/** Free, keyless routing via the public OSRM demo server. */
async function getOsrmRoute(origin: string, destination: string) {
  const [oLat, oLng] = origin.split(",");
  const [dLat, dLng] = destination.split(",");

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { next: { revalidate: 30 } });
    const json = await res.json();
    const route = json.routes?.[0];

    if (!route) {
      return NextResponse.json({ path: [], fallback: true });
    }

    const path = (route.geometry?.coordinates ?? []).map(
      ([lng, lat]: [number, number]) => ({ lat, lng })
    );

    return NextResponse.json({
      path,
      durationMinutes: route.duration
        ? Math.ceil(route.duration / 60)
        : null,
      distanceKm: route.distance
        ? Number((route.distance / 1000).toFixed(2))
        : null,
      fallback: false,
    });
  } catch {
    return NextResponse.json({ path: [], fallback: true });
  }
}
