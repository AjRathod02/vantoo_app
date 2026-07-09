import pg from "pg";

const vendorId = process.argv[2];
const adminId = process.argv[3];
if (!vendorId || !adminId || !process.env.DATABASE_URL) {
  console.error("Usage: DATABASE_URL=... node scripts/approve-vendor.mjs <vendorId> <adminUserId>");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("supabase.co")
    ? { rejectUnauthorized: false }
    : undefined,
});

await client.connect();
try {
  const result = await client.query(
    `UPDATE vendor.vendors SET status = 'approved', approved_at = NOW(), approved_by = $2, updated_at = NOW()
     WHERE id = $1 RETURNING status`,
    [vendorId, adminId]
  );
  console.log("vendor:", result.rows[0]);
  await client.query(`UPDATE vendor.stores SET is_active = TRUE WHERE vendor_id = $1`, [vendorId]);
  console.log("stores activated");
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await client.end();
}
