import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL to run platform migrations.");
  process.exit(1);
}

const migrationsDir = join(__dirname, "../database/migrations");
const legacyMigration = join(__dirname, "../../supabase/migrations/001_initial_schema.sql");

const client = new Client({
  connectionString: url,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

async function ensureMigrationTable() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations() {
  const result = await client.query(`SELECT filename FROM public.schema_migrations ORDER BY id`);
  return new Set(result.rows.map((r) => r.filename));
}

async function applyMigration(filename, sql) {
  console.log(`Applying: ${filename}`);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(`INSERT INTO public.schema_migrations (filename) VALUES ($1)`, [filename]);
    await client.query("COMMIT");
    console.log(`Applied: ${filename}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

try {
  await client.connect();
  await ensureMigrationTable();
  const applied = await getAppliedMigrations();

  const legacyName = "001_initial_schema.sql";
  if (!applied.has(legacyName)) {
    const sql = readFileSync(legacyMigration, "utf8");
    await applyMigration(legacyName, sql);
  }

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipped (already applied): ${file}`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    await applyMigration(file, sql);
  }

  console.log("All migrations applied successfully.");
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await client.end();
}
