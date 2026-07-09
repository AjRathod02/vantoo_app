import { NextResponse } from "next/server";
import { parseNominatimResult } from "@/lib/location/reverseGeocode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: { "User-Agent": "Vantoo/1.0 (delivery-app)" },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Geocode failed" }, { status: 502 });
    }

    const data = await res.json();
    const place = parseNominatimResult(data, lat, lng);
    return NextResponse.json(place);
  } catch {
    return NextResponse.json({ error: "Geocode failed" }, { status: 502 });
  }
}
