import pg from "pg";

const email = process.argv[2];
if (!email || !process.env.DATABASE_URL) {
  console.error("Usage: DATABASE_URL=... node scripts/promote-admin.mjs user@email.com");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("supabase.co")
    ? { rejectUnauthorized: false }
    : undefined,
});

await client.connect();
const result = await client.query(
  `UPDATE public.profiles SET role = 'admin' WHERE email = $1 RETURNING id, email, role`,
  [email]
);
console.log(result.rows[0] ?? "No profile found");
await client.end();
