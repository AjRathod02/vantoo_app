import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64);
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

const url = process.env.DATABASE_URL;
const email = process.argv[2] ?? "admin@vantoo.com";
const password = process.argv[3] ?? "Admin@Vantoo2024!";
const name = process.argv[4] ?? "Super Admin";

if (!url) {
  console.error("Set DATABASE_URL in .env or .env.local, or run:");
  console.error("  DATABASE_URL=... node scripts/create-super-admin.mjs [email] [password] [name]");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();

  const existing = await client.query(
    "SELECT id FROM public.admin_users WHERE email = $1",
    [email.toLowerCase()]
  );

  if (existing.rows.length) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);
  const { rows } = await client.query(
    `INSERT INTO public.admin_users (email, password_hash, name, role, status)
     VALUES ($1, $2, $3, 'super_admin', 'active')
     RETURNING id, email, name, role`,
    [email.toLowerCase(), passwordHash, name]
  );

  console.log("Super admin created:");
  console.log(rows[0]);
  console.log(`\nLogin at /admin/login with:\n  Email: ${email}\n  Password: ${password}`);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  console.error("\nRun migration first: npm run db:migrate:all");
  process.exit(1);
} finally {
  await client.end();
}
