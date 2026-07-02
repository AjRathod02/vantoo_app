import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

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
