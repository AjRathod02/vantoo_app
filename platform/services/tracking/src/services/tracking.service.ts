import { Redis } from "ioredis";
import { loadEnv } from "../config/env.js";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(loadEnv().REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 3 });
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

function trackingKey(orderId: string) {
  return `tracking:order:${orderId}`;
}

function channelKey(orderId: string) {
  return `tracking:channel:${orderId}`;
}

export interface TrackingPayload {
  orderId: string;
  riderId: string;
  riderName: string;
  riderPhone: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export async function setTracking(orderId: string, data: Omit<TrackingPayload, "orderId" | "updatedAt">) {
  const redis = getRedis();
  const payload: TrackingPayload = {
    orderId,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  await redis.set(trackingKey(orderId), JSON.stringify(payload), "EX", 86400);
  await redis.publish(channelKey(orderId), JSON.stringify(payload));
  return payload;
}

export async function getTracking(orderId: string): Promise<TrackingPayload | null> {
  const redis = getRedis();
  const raw = await redis.get(trackingKey(orderId));
  if (!raw) return null;
  return JSON.parse(raw) as TrackingPayload;
}

export { channelKey };
