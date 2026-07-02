import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const { Client } = pg;

export async function runDatabaseMigration(databaseUrl: string) {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/001_initial_schema.sql"),
    "utf8"
  );

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query(sql);
    return { ok: true as const, message: "Migration applied successfully." };
  } finally {
    await client.end();
  }
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
