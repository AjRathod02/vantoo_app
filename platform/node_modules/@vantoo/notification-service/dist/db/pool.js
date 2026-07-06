import pg from "pg";
import { Redis } from "ioredis";
import { loadEnv } from "../config/env.js";
const { Pool } = pg;
let pool = null;
let redis = null;
export function getPool() {
    if (!pool) {
        const env = loadEnv();
        pool = new Pool({
            connectionString: env.DATABASE_URL,
            ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
        });
    }
    return pool;
}
export function getRedis() {
    if (!redis) {
        redis = new Redis(loadEnv().REDIS_URL, { lazyConnect: true });
    }
    return redis;
}
export async function closeConnections() {
    if (pool)
        await pool.end();
    if (redis)
        await redis.quit();
}
