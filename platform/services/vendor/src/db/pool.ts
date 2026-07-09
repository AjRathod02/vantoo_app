import pg from "pg";
import { loadEnv } from "../config/env.js";

const { Pool } = pg;
let pool: pg.Pool | null = null;

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

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
