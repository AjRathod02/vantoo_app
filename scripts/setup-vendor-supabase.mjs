import pg from "pg";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  try {
    for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // .env.local optional if DATABASE_URL is already set
  }
}

loadEnvLocal();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL in .env.local");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

const rbacOnly = readFileSync(
  join(__dirname, "../platform/database/migrations/002_supabase_rbac_only.sql"),
  "utf8"
);
const core = readFileSync(
  join(__dirname, "../platform/database/migrations/003_enterprise_core_entities.sql"),
  "utf8"
).replaceAll("auth.set_updated_at()", "public.set_updated_at()");
const notifications = readFileSync(
  join(__dirname, "../platform/database/migrations/006_notifications.sql"),
  "utf8"
);
const vendorPerms = readFileSync(
  join(__dirname, "../platform/database/migrations/007_supabase_vendor_permissions.sql"),
  "utf8"
);
const ordersPayments = readFileSync(
  join(__dirname, "../platform/database/migrations/004_enterprise_orders_payments.sql"),
  "utf8"
).replaceAll("auth.set_updated_at()", "public.set_updated_at()");

async function run(name, sql) {
  console.log(`Applying ${name}...`);
  await client.query(sql);
  console.log(`Applied ${name}`);
}

try {
  await client.connect();
  await client.query(`
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const applied = await client.query(`SELECT filename FROM public.schema_migrations`);
  const done = new Set(applied.rows.map((r) => r.filename));

  const steps = [
    ["001_initial_schema.sql", null],
    ["002_supabase_rbac_only.sql", rbacOnly],
    ["003_enterprise_core_entities.sql", core],
    ["004_enterprise_orders_payments.sql", ordersPayments],
    ["006_notifications.sql", notifications],
    ["007_supabase_vendor_permissions.sql", vendorPerms],
  ];

  for (const [file, sql] of steps) {
    if (done.has(file)) {
      console.log(`Skipped ${file}`);
      continue;
    }
    if (file === "001_initial_schema.sql") {
      const check = await client.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles'`
      );
      if (check.rowCount) {
        await client.query(`INSERT INTO public.schema_migrations (filename) VALUES ($1)`, [file]);
        console.log(`Marked ${file} (already present)`);
        continue;
      }
    }
    if (!sql) continue;
    await run(file, sql);
    await client.query(`INSERT INTO public.schema_migrations (filename) VALUES ($1)`, [file]);
  }

  console.log("Vendor platform schema ready on Supabase.");
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await client.end();
}
