import { getPool } from "../db/pool.js";
import { AppError, slugify } from "../utils/errors.js";
export class VendorProductService {
    async ensureVendorStore(vendorId, storeId) {
        const pool = getPool();
        if (storeId) {
            const r = await pool.query(`SELECT id FROM vendor.stores WHERE id = $1 AND vendor_id = $2 AND deleted_at IS NULL`, [storeId, vendorId]);
            if (r.rowCount === 0)
                throw AppError.notFound("Store not found");
            return storeId;
        }
        const r = await pool.query(`SELECT id FROM vendor.stores WHERE vendor_id = $1 AND deleted_at IS NULL ORDER BY created_at LIMIT 1`, [vendorId]);
        if (r.rowCount === 0)
            throw AppError.validation("No store found for vendor");
        return r.rows[0].id;
    }
    async list(vendorId) {
        const pool = getPool();
        const result = await pool.query(`SELECT p.id, p.legacy_id, p.vendor_id, p.store_id, p.name, p.slug, p.description,
              p.service_type, p.status, p.base_price, p.compare_at_price, p.tax_rate,
              p.rating, p.review_count, pi.url AS image_url, pv.id AS variant_id, pv.sku,
              COALESCE(SUM(i.quantity - i.reserved), 0)::INT AS stock_quantity
       FROM catalog.products p
       LEFT JOIN catalog.product_variants pv ON pv.product_id = p.id AND pv.is_default = TRUE
       LEFT JOIN catalog.product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
       LEFT JOIN catalog.inventory i ON i.variant_id = pv.id
       WHERE p.vendor_id = $1 AND p.deleted_at IS NULL
       GROUP BY p.id, pi.url, pv.id, pv.sku
       ORDER BY p.created_at DESC`, [vendorId]);
        return result.rows.map((r) => ({
            id: r.id,
            legacyId: r.legacy_id,
            vendorId: r.vendor_id,
            storeId: r.store_id,
            categoryId: null,
            categoryName: null,
            brandId: null,
            brandName: null,
            name: r.name,
            slug: r.slug,
            description: r.description,
            serviceType: r.service_type,
            status: r.status,
            basePrice: Number(r.base_price),
            compareAtPrice: r.compare_at_price ? Number(r.compare_at_price) : null,
            taxRate: Number(r.tax_rate),
            rating: Number(r.rating),
            reviewCount: r.review_count,
            image: r.image_url,
            unit: null,
            inStock: Number(r.stock_quantity) > 0,
            stockQuantity: Number(r.stock_quantity),
            variantId: r.variant_id,
            sku: r.sku,
            tags: [],
        }));
    }
    async create(vendorId, input) {
        const pool = getPool();
        const storeId = await this.ensureVendorStore(vendorId, input.storeId);
        const slug = slugify(input.name) + "-" + Date.now().toString(36);
        const sku = `SKU-${Date.now().toString(36).toUpperCase()}`;
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            let categoryId = null;
            if (input.categoryName) {
                const catSlug = slugify(`${input.serviceType}-${input.categoryName}`);
                const cat = await client.query(`INSERT INTO catalog.categories (name, slug, service_type) VALUES ($1,$2,$3)
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [input.categoryName, catSlug, input.serviceType]);
                categoryId = cat.rows[0].id;
            }
            let brandId = null;
            if (input.brandName) {
                const brandSlug = slugify(input.brandName);
                const brand = await client.query(`INSERT INTO catalog.brands (name, slug) VALUES ($1,$2)
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [input.brandName, brandSlug]);
                brandId = brand.rows[0].id;
            }
            const prod = await client.query(`INSERT INTO catalog.products (vendor_id, store_id, category_id, brand_id, name, slug, description, service_type, status, base_price, compare_at_price, tax_rate)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'draft',$9,$10,$11) RETURNING id`, [
                vendorId, storeId, categoryId, brandId,
                input.name, slug, input.description ?? "",
                input.serviceType, input.basePrice,
                input.compareAtPrice ?? null, input.taxRate ?? 0,
            ]);
            const productId = prod.rows[0].id;
            const variant = await client.query(`INSERT INTO catalog.product_variants (product_id, sku, name, price, is_default, attributes)
         VALUES ($1,$2,'Default',$3,TRUE,$4) RETURNING id`, [productId, sku, input.basePrice, JSON.stringify({ unit: input.unit ?? null })]);
            if (input.imageUrl) {
                await client.query(`INSERT INTO catalog.product_images (product_id, variant_id, url, is_primary) VALUES ($1,$2,$3,TRUE)`, [productId, variant.rows[0].id, input.imageUrl]);
            }
            const stock = input.initialStock ?? 0;
            await client.query(`INSERT INTO catalog.inventory (variant_id, store_id, quantity, batch_number) VALUES ($1,$2,$3,'default')`, [variant.rows[0].id, storeId, stock]);
            await client.query("COMMIT");
            const products = await this.list(vendorId);
            const created = products.find((p) => p.id === productId);
            if (!created)
                throw new Error("Failed to fetch created product");
            return created;
        }
        catch (e) {
            await client.query("ROLLBACK");
            throw e;
        }
        finally {
            client.release();
        }
    }
    async update(vendorId, productId, input) {
        const pool = getPool();
        const existing = await pool.query(`SELECT id FROM catalog.products WHERE id = $1 AND vendor_id = $2 AND deleted_at IS NULL`, [productId, vendorId]);
        if (existing.rowCount === 0)
            throw AppError.notFound("Product not found");
        const fields = [];
        const values = [productId, vendorId];
        let idx = 3;
        const mapping = {
            name: "name", description: "description", basePrice: "base_price",
            compareAtPrice: "compare_at_price", taxRate: "tax_rate", status: "status",
        };
        for (const [key, col] of Object.entries(mapping)) {
            if (input[key] !== undefined) {
                fields.push(`${col} = $${idx++}`);
                values.push(input[key]);
            }
        }
        if (fields.length > 0) {
            await pool.query(`UPDATE catalog.products SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $1 AND vendor_id = $2`, values);
        }
        if (input.initialStock !== undefined) {
            await pool.query(`UPDATE catalog.inventory SET quantity = $3, updated_at = NOW()
         FROM catalog.product_variants pv
         WHERE catalog.inventory.variant_id = pv.id AND pv.product_id = $1 AND pv.is_default = TRUE`, [productId, vendorId, input.initialStock]);
        }
        const products = await this.list(vendorId);
        const updated = products.find((p) => p.id === productId);
        if (!updated)
            throw AppError.notFound("Product not found");
        return updated;
    }
    async publish(vendorId, productId) {
        return this.update(vendorId, productId, { status: "active" });
    }
    async remove(vendorId, productId) {
        const pool = getPool();
        const result = await pool.query(`UPDATE catalog.products SET deleted_at = NOW(), status = 'discontinued'
       WHERE id = $1 AND vendor_id = $2 AND deleted_at IS NULL RETURNING id`, [productId, vendorId]);
        if (result.rowCount === 0)
            throw AppError.notFound("Product not found");
    }
}
export const vendorProductService = new VendorProductService();
