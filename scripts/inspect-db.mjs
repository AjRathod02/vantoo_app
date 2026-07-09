import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

await client.connect();
const tables = await client.query(`
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE (table_schema, table_name) IN (
    ('auth', 'users'),
    ('auth', 'roles'),
    ('vendor', 'vendors'),
    ('public', 'profiles'),
    ('public', 'schema_migrations')
  )
  ORDER BY 1, 2
`);
console.log("tables:", tables.rows);

const migrations = await client.query(
  `SELECT filename FROM public.schema_migrations ORDER BY id`
).catch(() => ({ rows: [] }));
console.log("migrations:", migrations.rows);

const profiles = await client.query(
  `SELECT email, role FROM public.profiles ORDER BY created_at DESC LIMIT 3`
).catch(() => ({ rows: [] }));
console.log("profiles:", profiles.rows);

const vendors = await client.query(
  `SELECT id, business_name, status FROM vendor.vendors ORDER BY created_at DESC LIMIT 1`
).catch(() => ({ rows: [] }));
console.log("vendors:", vendors.rows);

await client.end();
