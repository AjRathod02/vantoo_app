import { isPlatformEnabled, getServiceUrl } from "./client";

export interface OrderTrackingPayload {
  orderId: string;
  riderId: string;
  riderName: string;
  riderPhone: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  riderLat?: number;
  riderLng?: number;
  riderSpeed?: number;
  riderHeading?: number;
  riderRating?: number;
  storeLat?: number;
  storeLng?: number;
  storeName?: string;
  customerLat?: number;
  customerLng?: number;
  etaMinutes?: number;
  distanceKm?: number;
  distanceRemainingM?: number;
  updatedAt: string;
}

export async function getOrderTracking(orderId: string): Promise<OrderTrackingPayload | null> {
  if (!isPlatformEnabled()) return null;
  try {
    const res = await fetch(`${getServiceUrl("tracking")}/v1/tracking/orders/${encodeURIComponent(orderId)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export function getTrackingStreamUrl(orderId: string): string {
  return `${getServiceUrl("tracking")}/v1/tracking/orders/${encodeURIComponent(orderId)}/stream`;
}
