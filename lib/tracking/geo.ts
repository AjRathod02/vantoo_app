import type { GeoPoint } from "@/lib/types";

const EARTH_RADIUS_KM = 6371;

export const DEFAULT_STORE: GeoPoint = {
  lat: 12.9716,
  lng: 77.5946,
};

export function hashPincode(pincode: string): number {
  let hash = 0;
  for (let i = 0; i < pincode.length; i++) {
    hash = (hash * 31 + pincode.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministic customer coords from delivery pincode (Bangalore area). */
export function customerCoordsFromPincode(pincode: string): GeoPoint {
  const hash = hashPincode(pincode || "560001");
  const latOffset = ((hash % 1000) / 1000 - 0.5) * 0.04;
  const lngOffset = (((hash >> 10) % 1000) / 1000 - 0.5) * 0.04;
  return {
    lat: DEFAULT_STORE.lat + latOffset + 0.012,
    lng: DEFAULT_STORE.lng + lngOffset + 0.018,
  };
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function bearingDegrees(from: GeoPoint, to: GeoPoint): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function estimateEtaMinutes(
  distanceKm: number,
  speedKmh = 25,
  trafficFactor = 1.25
): number {
  if (distanceKm <= 0) return 1;
  const effectiveSpeed = Math.max(speedKmh / trafficFactor, 8);
  return Math.max(1, Math.ceil((distanceKm / effectiveSpeed) * 60));
}

export function lerpPoint(from: GeoPoint, to: GeoPoint, t: number): GeoPoint {
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  };
}

export function decodePolyline(encoded: string): GeoPoint[] {
  const points: GeoPoint[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}
