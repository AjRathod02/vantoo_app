import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const { Client } = pg;

function loadEnvFile(filename) {
  try {
    for (const line of readFileSync(join(root, filename), "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // optional if DATABASE_URL is already in the environment
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL (Supabase → Settings → Database → URI)");
  process.exit(1);
}

const migrationsDir = join(__dirname, "../supabase/migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const applied = await client.query(`SELECT filename FROM public.schema_migrations`);
  const done = new Set(applied.rows.map((r) => r.filename));

  for (const file of files) {
    if (done.has(file)) {
      console.log(`Skipped ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`Applying ${file}...`);
    await client.query(sql);
    await client.query(`INSERT INTO public.schema_migrations (filename) VALUES ($1)`, [file]);
    console.log(`  ✓ ${file}`);
  }
  console.log("All migrations applied successfully.");
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  console.error(message);
  if (
    message.includes("ENOENT") ||
    message.includes("ENETUNREACH") ||
    message.includes("EHOSTUNREACH")
  ) {
    const host = (() => {
      try {
        return new URL(url).hostname;
      } catch {
        return "";
      }
    })();
    if (host.startsWith("db.")) {
      console.error(
        "\nDirect Supabase host is IPv6-only. On IPv4-only networks, use the Session pooler URI instead:\n" +
          "  Supabase Dashboard → Connect → Session pooler (port 5432)\n" +
          "  postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-[N]-[REGION].pooler.supabase.com:5432/postgres\n" +
          "Percent-encode special characters in the password (e.g. @ → %40)."
      );
    }
  }
  process.exit(1);
} finally {
  await client.end();
}
