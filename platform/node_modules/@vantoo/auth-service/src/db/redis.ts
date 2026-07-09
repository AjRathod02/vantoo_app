import { Redis } from "ioredis";
import { loadEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const env = loadEnv();
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });

    redis.on("error", () => {
      // Redis optional in local dev without Docker
    });
  }
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
