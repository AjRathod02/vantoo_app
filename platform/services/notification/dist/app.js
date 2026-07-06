import Fastify from "fastify";
import cors from "@fastify/cors";
import { loadEnv } from "./config/env.js";
import { notificationRoutes } from "./routes/notification.routes.js";
export async function buildApp() {
    const env = loadEnv();
    const app = Fastify({ trustProxy: true });
    await app.register(cors, { origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()) });
    await app.register(notificationRoutes);
    return app;
}
