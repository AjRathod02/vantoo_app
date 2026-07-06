import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { getPool, closePool } from "./db/pool.js";
import { getRedis, closeRedis } from "./db/redis.js";
import { logger } from "./utils/logger.js";
async function main() {
    const env = loadEnv();
    const pool = getPool();
    await pool.query("SELECT 1");
    const redis = getRedis();
    await redis.connect();
    await redis.ping();
    const app = await buildApp();
    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info({ port: env.PORT, host: env.HOST }, "Auth service started");
    const shutdown = async (signal) => {
        logger.info({ signal }, "Shutting down");
        await app.close();
        await closePool();
        await closeRedis();
        process.exit(0);
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}
main().catch((err) => {
    logger.fatal({ err }, "Failed to start auth service");
    process.exit(1);
});
