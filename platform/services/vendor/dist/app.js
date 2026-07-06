import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { loadEnv } from "./config/env.js";
import { vendorRoutes } from "./routes/vendor.routes.js";
export async function buildApp() {
    const env = loadEnv();
    const app = Fastify({ trustProxy: true });
    await app.register(cors, { origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()) });
    await app.register(helmet, { contentSecurityPolicy: false });
    await app.register(rateLimit, { max: 150, timeWindow: "1 minute" });
    await app.register(vendorRoutes);
    return app;
}
