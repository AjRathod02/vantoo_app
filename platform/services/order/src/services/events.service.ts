import { loadEnv } from "../config/env.js";
import { getRedis } from "../db/pool.js";

export async function publishEvent(event: string, payload: Record<string, unknown>): Promise<void> {
  const redis = getRedis();
  if (redis.status !== "ready") await redis.connect();
  await redis.publish("vantoo:events", JSON.stringify({ event, payload, timestamp: new Date().toISOString() }));
}

export async function notifyOrderStatusChange(order: {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
}): Promise<void> {
  const env = loadEnv();
  const templateMap: Record<string, string> = {
    confirmed: "order_confirmed",
    preparing: "order_preparing",
    in_transit: "order_out_for_delivery",
    delivered: "order_delivered",
    cancelled: "order_cancelled",
  };

  const template = templateMap[order.status];
  if (!template) return;

  try {
    await fetch(`${env.NOTIFICATION_SERVICE_URL}/v1/notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": env.INTERNAL_SERVICE_KEY,
      },
      body: JSON.stringify({
        userId: order.userId,
        channel: "in_app",
        templateName: template,
        variables: { orderNumber: order.orderNumber },
        referenceType: "order",
        referenceId: order.id,
      }),
    });
  } catch {
    // Non-blocking — notification failure must not fail order flow
  }
}
