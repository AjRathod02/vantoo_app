import { EventEmitter } from "events";
import type { RiderLocationUpdate, UserLocationRecord } from "@/lib/types";

const globalForTracking = globalThis as unknown as {
  vantooTrackingEmitter?: EventEmitter;
};

export const trackingEmitter =
  globalForTracking.vantooTrackingEmitter ?? new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalForTracking.vantooTrackingEmitter = trackingEmitter;
}

export function orderChannel(orderId: string) {
  return `order:${orderId}`;
}

export function userChannel(userId: string) {
  return `user:${userId}`;
}

export const ADMIN_LOCATIONS_CHANNEL = "admin:locations";

export function publishRiderLocation(
  orderId: string,
  payload: RiderLocationUpdate
) {
  trackingEmitter.emit(orderChannel(orderId), payload);
}

export function subscribeRiderLocation(
  orderId: string,
  listener: (payload: RiderLocationUpdate) => void
) {
  trackingEmitter.on(orderChannel(orderId), listener);
  return () => trackingEmitter.off(orderChannel(orderId), listener);
}

export function publishUserLocation(record: UserLocationRecord) {
  trackingEmitter.emit(userChannel(record.userId), record);
  trackingEmitter.emit(ADMIN_LOCATIONS_CHANNEL, record);
  if (record.orderId) {
    trackingEmitter.emit(orderChannel(record.orderId), {
      orderId: record.orderId,
      lat: record.latitude,
      lng: record.longitude,
      speed: record.speed,
      heading: record.heading,
      timestamp: record.updatedAt,
    });
  }
}

export function subscribeUserLocation(
  userId: string,
  listener: (record: UserLocationRecord) => void
) {
  trackingEmitter.on(userChannel(userId), listener);
  return () => trackingEmitter.off(userChannel(userId), listener);
}

export function subscribeAdminLocations(
  listener: (record: UserLocationRecord) => void
) {
  trackingEmitter.on(ADMIN_LOCATIONS_CHANNEL, listener);
  return () => trackingEmitter.off(ADMIN_LOCATIONS_CHANNEL, listener);
}
