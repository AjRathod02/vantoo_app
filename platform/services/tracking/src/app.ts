import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { loadEnv } from "./config/env.js";
import { trackingRoutes } from "./routes/tracking.routes.js";
import { initTrackingSocket } from "./socket.js";

export async function buildApp() {
  const env = loadEnv();
  const app = Fastify({ trustProxy: true });
  const corsOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim());
  await app.register(cors, { origin: corsOrigins });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
  await app.register(trackingRoutes);

  await app.ready();
  initTrackingSocket(app.server, corsOrigins);

  return app;
}
