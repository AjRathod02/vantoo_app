import pg from "pg";
import { Redis } from "ioredis";
import { loadEnv } from "../config/env.js";

const { Pool } = pg;
let pool: pg.Pool | null = null;
let redis: Redis | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    const env = loadEnv();
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl:
        env.NODE_ENV === "production" || env.DATABASE_URL.includes("supabase.co")
          ? { rejectUnauthorized: false }
          : undefined,
      max: 20,
    });
  }
  return pool;
}

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(loadEnv().REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    redis.on("error", () => {
      // Redis is optional in local dev without Docker
    });
  }
  return redis;
}

export async function closeConnections(): Promise<void> {
  if (pool) await pool.end();
  if (redis) await redis.quit();
  pool = null;
  redis = null;
}
