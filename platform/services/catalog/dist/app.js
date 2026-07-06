import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { loadEnv } from "./config/env.js";
import { catalogRoutes } from "./routes/catalog.routes.js";
export async function buildApp() {
    const env = loadEnv();
    const app = Fastify({ trustProxy: true, requestIdHeader: "x-request-id" });
    await app.register(cors, { origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()), credentials: true });
    await app.register(helmet, { contentSecurityPolicy: env.NODE_ENV === "production" });
    await app.register(rateLimit, { max: 200, timeWindow: "1 minute" });
    await app.register(catalogRoutes);
    return app;
}
