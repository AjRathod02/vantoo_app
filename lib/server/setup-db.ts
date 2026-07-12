import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const { Client } = pg;

function listMigrationFiles() {
  const dir = join(process.cwd(), "supabase/migrations");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => join(dir, f));
}

export async function runDatabaseMigration(databaseUrl: string) {
  const files = listMigrationFiles();
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const applied: string[] = [];
    for (const file of files) {
      const sql = readFileSync(file, "utf8");
      await client.query(sql);
      applied.push(file.split(/[/\\]/).pop()!);
    }
    return {
      ok: true as const,
      message: `Applied ${applied.length} migrations successfully.`,
      applied,
    };
  } finally {
    await client.end();
  }
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
