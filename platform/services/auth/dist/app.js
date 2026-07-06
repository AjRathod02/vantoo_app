import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { loadEnv } from "./config/env.js";
import { registerErrorHandler } from "./middleware/error.middleware.js";
import { authRoutes } from "./routes/auth.routes.js";
import { logger } from "./utils/logger.js";
export async function buildApp() {
    const env = loadEnv();
    const app = Fastify({
        logger: false,
        trustProxy: true,
        requestIdHeader: "x-request-id",
        genReqId: () => crypto.randomUUID(),
    });
    await app.register(cors, {
        origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
        credentials: true,
    });
    await app.register(helmet, {
        contentSecurityPolicy: env.NODE_ENV === "production",
    });
    await app.register(rateLimit, {
        max: 100,
        timeWindow: "1 minute",
    });
    registerErrorHandler(app);
    await app.register(authRoutes);
    app.addHook("onRequest", async (request) => {
        logger.info({ reqId: request.id, method: request.method, url: request.url }, "Incoming request");
    });
    return app;
}
