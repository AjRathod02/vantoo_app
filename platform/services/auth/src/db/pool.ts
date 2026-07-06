import pg from "pg";
import { loadEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    const env = loadEnv();
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      logger.error({ err }, "Unexpected PostgreSQL pool error");
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
