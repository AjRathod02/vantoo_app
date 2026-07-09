import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { loadEnv } from "../config/env.js";
import { getRedis, getTracking, setTracking, channelKey } from "../services/tracking.service.js";
import { emitRiderLocation } from "../socket.js";

const updateSchema = z.object({
  riderId: z.string().uuid(),
  riderName: z.string(),
  riderPhone: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  etaMinutes: z.number().optional(),
  distanceKm: z.number().optional(),
  distanceRemainingM: z.number().optional(),
  riderRating: z.number().optional(),
});

async function internalAuth(request: import("fastify").FastifyRequest) {
  const env = loadEnv();
  const key = request.headers["x-internal-key"];
  if (key !== env.INTERNAL_SERVICE_KEY) {
    throw { statusCode: 403, message: "Invalid internal key" };
  }
}

export async function trackingRoutes(app: FastifyInstance) {
  app.get("/v1/tracking/orders/:orderId", async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const tracking = await getTracking(orderId);
    return reply.send({ success: true, data: tracking });
  });

  app.put("/v1/tracking/orders/:orderId", async (request, reply) => {
    try {
      await internalAuth(request);
    } catch (e) {
      const err = e as { statusCode: number; message: string };
      return reply.status(err.statusCode).send({ success: false, error: { message: err.message } });
    }

    const { orderId } = request.params as { orderId: string };
    const input = updateSchema.parse(request.body);
    const tracking = await setTracking(orderId, input);
    emitRiderLocation(tracking);
    return reply.send({ success: true, data: tracking });
  });

  app.get("/v1/tracking/orders/:orderId/stream", async (request, reply) => {
    const { orderId } = request.params as { orderId: string };

    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const send = (data: unknown) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const existing = await getTracking(orderId);
    if (existing) send(existing);

    const redis = getRedis();
    const subscriber = redis.duplicate();
    await subscriber.connect();
    await subscriber.subscribe(channelKey(orderId));

    subscriber.on("message", (_channel, message) => {
      try {
        send(JSON.parse(message));
      } catch {
        // ignore
      }
    });

    const heartbeat = setInterval(() => {
      reply.raw.write(": heartbeat\n\n");
    }, 15000);

    request.raw.on("close", async () => {
      clearInterval(heartbeat);
      await subscriber.unsubscribe(channelKey(orderId));
      await subscriber.quit();
    });
  });

  app.get("/health", async () => ({ status: "ok", service: "tracking-service" }));
}
