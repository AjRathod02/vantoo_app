import { readFileSync } from "node:fs";
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
  console.error(
    "Set DATABASE_URL (Supabase → Project Settings → Database → Connection string URI)"
  );
  process.exit(1);
}

const sql = readFileSync(
  join(__dirname, "../supabase/migrations/001_initial_schema.sql"),
  "utf8"
);

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Migration applied successfully.");
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await client.end();
}
