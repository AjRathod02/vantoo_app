import pg from "pg";
import { loadEnv } from "../config/env.js";
const { Pool } = pg;
let pool = null;
export function getPool() {
    if (!pool) {
        const env = loadEnv();
        pool = new Pool({
            connectionString: env.DATABASE_URL,
            ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
            max: 20,
        });
    }
    return pool;
}
export async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
