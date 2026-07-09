/**
 * Seeds catalog schema from legacy public.products or bundled product data.
 * Usage: DATABASE_URL=... node platform/database/seeds/seed-catalog.mjs
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../../..");

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

const { Client } = pg;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL");
  process.exit(1);
}

const client = new Client({
  connectionString: url,
  ssl:
    process.env.DATABASE_SSL === "true" || url.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : undefined,
});

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function ensureVendorUser() {
  const approved = await client.query(
    `SELECT user_id FROM vendor.vendors WHERE status = 'approved' ORDER BY created_at LIMIT 1`
  );
  if (approved.rows.length > 0) return approved.rows[0].user_id;

  const email = "vendor-system@vantoo.internal";
  const existing = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [email]);
  if (existing.rows.length > 0) return existing.rows[0].id;

  const result = await client.query(
    `INSERT INTO auth.users (email, first_name, last_name, status, email_verified)
     VALUES ($1, 'Vantoo', 'Vendor', 'active', TRUE) RETURNING id`,
    [email]
  );
  await client.query(
    `INSERT INTO auth.user_roles (user_id, role_id)
     SELECT $1, id FROM auth.roles WHERE name = 'vendor' ON CONFLICT DO NOTHING`,
    [result.rows[0].id]
  );
  return result.rows[0].id;
}

async function seed() {
  await client.connect();

  const vendorUserId = await ensureVendorUser();

  let vendorId;
  const vendorCheck = await client.query(`SELECT id FROM vendor.vendors WHERE slug = 'vantoo-default'`);
  if (vendorCheck.rows.length > 0) {
    vendorId = vendorCheck.rows[0].id;
  } else {
    const v = await client.query(
      `INSERT INTO vendor.vendors (user_id, business_name, slug, contact_email, contact_phone, status, approved_at)
       VALUES ($1, 'Vantoo Default Vendor', 'vantoo-default', 'vendor@vantoo.com', '+919999999999', 'approved', NOW())
       RETURNING id`,
      [vendorUserId]
    );
    vendorId = v.rows[0].id;
  }

  let storeId;
  const storeCheck = await client.query(`SELECT id FROM vendor.stores WHERE slug = 'vantoo-main-store' AND vendor_id = $1`, [vendorId]);
  if (storeCheck.rows.length > 0) {
    storeId = storeCheck.rows[0].id;
  } else {
    const s = await client.query(
      `INSERT INTO vendor.stores (vendor_id, name, slug, store_type, service_types, address_line1, city, pincode, is_active)
       VALUES ($1, 'Vantoo Main Store', 'vantoo-main-store', 'grocery', ARRAY['food','grocery','medicine','ecommerce']::catalog.service_type[],
               '123 MG Road', 'Bengaluru', '560001', TRUE)
       RETURNING id`,
      [vendorId]
    );
    storeId = s.rows[0].id;
  }

  // Try legacy public.products first
  let products = [];
  try {
    const legacy = await client.query(`SELECT * FROM public.products ORDER BY id`);
    if (legacy.rows.length > 0) {
      products = legacy.rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        service: r.service,
        category: r.category,
        brand: r.brand,
        price: Number(r.price),
        originalPrice: r.original_price ? Number(r.original_price) : null,
        rating: Number(r.rating),
        reviews: r.reviews,
        image: r.image,
        unit: r.unit,
        inStock: r.in_stock,
      }));
      console.log(`Migrating ${products.length} products from public.products`);
    }
  } catch {
    // public.products may not exist
  }

  if (products.length === 0) {
    const jsonPath = join(__dirname, "catalog-products.json");
    products = JSON.parse(readFileSync(jsonPath, "utf8"));
    console.log(`Seeding ${products.length} products from catalog-products.json`);
  }

  let seeded = 0;
  for (const p of products) {
    const existing = await client.query(`SELECT id FROM catalog.products WHERE legacy_id = $1`, [p.id]);
    if (existing.rows.length > 0) continue;

    // Brand
    let brandId = null;
    if (p.brand) {
      const brandSlug = slugify(p.brand);
      const b = await client.query(
        `INSERT INTO catalog.brands (name, slug) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [p.brand, brandSlug]
      );
      brandId = b.rows[0].id;
    }

    // Category
    let categoryId = null;
    if (p.category) {
      const catSlug = slugify(`${p.service}-${p.category}`);
      const c = await client.query(
        `INSERT INTO catalog.categories (name, slug, service_type) VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [p.category, catSlug, p.service]
      );
      categoryId = c.rows[0].id;
    }

    const productSlug = slugify(p.name);
    const status = p.inStock ? "active" : "out_of_stock";

    const prod = await client.query(
      `INSERT INTO catalog.products (
        vendor_id, store_id, category_id, brand_id, legacy_id, name, slug, description,
        service_type, status, base_price, compare_at_price, rating, review_count, tags
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING id`,
      [
        vendorId, storeId, categoryId, brandId, p.id, p.name, productSlug,
        p.description ?? "", p.service, status, p.price, p.originalPrice ?? null,
        p.rating ?? 4, p.reviews ?? 0, [],
      ]
    );
    const productId = prod.rows[0].id;

    const variant = await client.query(
      `INSERT INTO catalog.product_variants (product_id, sku, name, price, is_default, attributes)
       VALUES ($1, $2, 'Default', $3, TRUE, $4) RETURNING id`,
      [productId, p.id, p.price, JSON.stringify({ unit: p.unit ?? null })]
    );

    if (p.image) {
      await client.query(
        `INSERT INTO catalog.product_images (product_id, variant_id, url, is_primary, sort_order)
         VALUES ($1, $2, $3, TRUE, 0)`,
        [productId, variant.rows[0].id, p.image]
      );
    }

    await client.query(
      `INSERT INTO catalog.inventory (variant_id, store_id, quantity, batch_number)
       VALUES ($1, $2, $3, 'default')
       ON CONFLICT (variant_id, store_id, batch_number) DO UPDATE SET quantity = EXCLUDED.quantity`,
      [variant.rows[0].id, storeId, p.inStock ? 100 : 0]
    );

    seeded++;
  }

  console.log(`Catalog seed complete. ${seeded} new products inserted.`);
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => client.end());
