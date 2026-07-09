export interface ResolvedPlace {
  city: string;
  area: string;
  pincode: string;
  line1: string;
  line2: string;
  latitude: number;
  longitude: number;
}

export function parseNominatimResult(
  data: Record<string, unknown>,
  lat: number,
  lng: number
): ResolvedPlace {
  const address = (data.address ?? {}) as Record<string, string>;
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.state_district ||
    address.county ||
    "Unknown";
  const area =
    address.suburb ||
    address.neighbourhood ||
    address.quarter ||
    address.road ||
    "";
  const pincode = address.postcode ?? "";
  const road = address.road ?? address.pedestrian ?? "";
  const house = address.house_number ?? "";

  return {
    city,
    area,
    pincode,
    line1: house ? `${house}, ${road}`.replace(/^, /, "") : road,
    line2: area,
    latitude: lat,
    longitude: lng,
  };
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ResolvedPlace | null> {
  try {
    const res = await fetch(
      `/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`
    );
    if (!res.ok) return null;
    return (await res.json()) as ResolvedPlace;
  } catch {
    return null;
  }
}
