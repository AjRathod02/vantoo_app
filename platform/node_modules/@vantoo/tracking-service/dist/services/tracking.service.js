import { Redis } from "ioredis";
import { loadEnv } from "../config/env.js";
let redis = null;
export function getRedis() {
    if (!redis) {
        redis = new Redis(loadEnv().REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 3 });
    }
    return redis;
}
export async function closeRedis() {
    if (redis) {
        await redis.quit();
        redis = null;
    }
}
function trackingKey(orderId) {
    return `tracking:order:${orderId}`;
}
function channelKey(orderId) {
    return `tracking:channel:${orderId}`;
}
export async function setTracking(orderId, data) {
    const redis = getRedis();
    const payload = {
        orderId,
        ...data,
        updatedAt: new Date().toISOString(),
    };
    await redis.set(trackingKey(orderId), JSON.stringify(payload), "EX", 86400);
    await redis.publish(channelKey(orderId), JSON.stringify(payload));
    return payload;
}
export async function getTracking(orderId) {
    const redis = getRedis();
    const raw = await redis.get(trackingKey(orderId));
    if (!raw)
        return null;
    return JSON.parse(raw);
}
export { channelKey };
