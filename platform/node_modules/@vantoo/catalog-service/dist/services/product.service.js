import { getPool } from "../db/pool.js";
import { AppError } from "../utils/errors.js";
const PRODUCT_SELECT = `
  SELECT
    p.id, p.legacy_id, p.vendor_id, p.store_id, p.category_id,
    c.name AS category_name, p.brand_id, b.name AS brand_name,
    p.name, p.slug, p.description, p.service_type, p.status,
    p.base_price, p.compare_at_price, p.tax_rate, p.rating, p.review_count,
    pi.url AS image_url, pv.id AS variant_id, pv.sku,
    pv.attributes->>'unit' AS unit,
    COALESCE(SUM(i.quantity - i.reserved), 0)::INT AS stock_quantity,
    p.tags
  FROM catalog.products p
  LEFT JOIN catalog.categories c ON c.id = p.category_id
  LEFT JOIN catalog.brands b ON b.id = p.brand_id
  LEFT JOIN catalog.product_variants pv ON pv.product_id = p.id AND pv.is_default = TRUE
  LEFT JOIN catalog.product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
  LEFT JOIN catalog.inventory i ON i.variant_id = pv.id
`;
function mapRow(row) {
    const stock = Number(row.stock_quantity);
    return {
        id: row.id,
        legacyId: row.legacy_id,
        vendorId: row.vendor_id,
        storeId: row.store_id,
        categoryId: row.category_id,
        categoryName: row.category_name,
        brandId: row.brand_id,
        brandName: row.brand_name,
        name: row.name,
        slug: row.slug,
        description: row.description,
        serviceType: row.service_type,
        status: row.status,
        basePrice: Number(row.base_price),
        compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : null,
        taxRate: Number(row.tax_rate),
        rating: Number(row.rating),
        reviewCount: row.review_count,
        image: row.image_url,
        unit: row.unit,
        inStock: stock > 0 && row.status === "active",
        stockQuantity: stock,
        variantId: row.variant_id,
        sku: row.sku,
        tags: row.tags ?? [],
    };
}
export class ProductService {
    async list(params) {
        const pool = getPool();
        const page = params.page ?? 1;
        const limit = params.limit ?? 24;
        const offset = (page - 1) * limit;
        const conditions = ["p.deleted_at IS NULL", "p.status = 'active'"];
        const values = [];
        let paramIdx = 1;
        if (params.service) {
            conditions.push(`p.service_type = $${paramIdx++}`);
            values.push(params.service);
        }
        if (params.category) {
            conditions.push(`(c.slug = $${paramIdx} OR c.name ILIKE $${paramIdx})`);
            values.push(params.category);
            paramIdx++;
        }
        if (params.q) {
            conditions.push(`(
        p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx}
        OR b.name ILIKE $${paramIdx}
        OR to_tsvector('english', p.name || ' ' || p.description) @@ plainto_tsquery('english', $${paramIdx + 1})
      )`);
            values.push(`%${params.q}%`, params.q);
            paramIdx += 2;
        }
        if (params.brands?.length) {
            conditions.push(`b.name = ANY($${paramIdx++})`);
            values.push(params.brands);
        }
        if (params.minPrice !== undefined) {
            conditions.push(`p.base_price >= $${paramIdx++}`);
            values.push(params.minPrice);
        }
        if (params.maxPrice !== undefined) {
            conditions.push(`p.base_price <= $${paramIdx++}`);
            values.push(params.maxPrice);
        }
        if (params.minRating !== undefined) {
            conditions.push(`p.rating >= $${paramIdx++}`);
            values.push(params.minRating);
        }
        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        let orderBy = "p.created_at DESC";
        if (params.sort === "price-asc")
            orderBy = "p.base_price ASC";
        else if (params.sort === "price-desc")
            orderBy = "p.base_price DESC";
        else if (params.sort === "rating")
            orderBy = "p.rating DESC";
        else if (params.sort === "newest")
            orderBy = "p.created_at DESC";
        const groupBy = `
      GROUP BY p.id, c.name, b.name, pi.url, pv.id, pv.sku, pv.attributes
    `;
        const countResult = await pool.query(`SELECT COUNT(DISTINCT p.id) AS count
       FROM catalog.products p
       LEFT JOIN catalog.categories c ON c.id = p.category_id
       LEFT JOIN catalog.brands b ON b.id = p.brand_id
       ${where}`, values);
        values.push(limit, offset);
        const result = await pool.query(`${PRODUCT_SELECT} ${where} ${groupBy}
       ORDER BY ${orderBy}
       LIMIT $${paramIdx++} OFFSET $${paramIdx}`, values);
        return {
            items: result.rows.map(mapRow),
            total: Number(countResult.rows[0]?.count ?? 0),
        };
    }
    async getById(id) {
        const pool = getPool();
        const result = await pool.query(`${PRODUCT_SELECT}
       WHERE (p.id = $1 OR p.legacy_id = $1 OR p.slug = $1) AND p.deleted_at IS NULL
       ${`GROUP BY p.id, c.name, b.name, pi.url, pv.id, pv.sku, pv.attributes`}`, [id]);
        if (result.rows.length === 0)
            throw AppError.notFound("Product not found");
        return mapRow(result.rows[0]);
    }
    async checkStock(items) {
        const pool = getPool();
        for (const item of items) {
            const result = await pool.query(`SELECT COALESCE(SUM(quantity - reserved), 0)::INT AS available
         FROM catalog.inventory WHERE variant_id = $1`, [item.variantId]);
            const available = result.rows[0]?.available ?? 0;
            if (available < item.quantity)
                return false;
        }
        return true;
    }
    async reserveStock(items, storeId) {
        const pool = getPool();
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            for (const item of items) {
                const result = await client.query(`UPDATE catalog.inventory
           SET reserved = reserved + $1, updated_at = NOW()
           WHERE variant_id = $2 AND ($3::UUID IS NULL OR store_id = $3)
             AND quantity - reserved >= $1
           RETURNING id`, [item.quantity, item.variantId, storeId ?? null]);
                if (result.rowCount === 0) {
                    throw AppError.validation(`Insufficient stock for variant ${item.variantId}`);
                }
            }
            await client.query("COMMIT");
        }
        catch (e) {
            await client.query("ROLLBACK");
            throw e;
        }
        finally {
            client.release();
        }
    }
    async commitStock(items) {
        const pool = getPool();
        for (const item of items) {
            await pool.query(`UPDATE catalog.inventory
         SET quantity = quantity - $1, reserved = GREATEST(reserved - $1, 0), updated_at = NOW()
         WHERE variant_id = $2`, [item.quantity, item.variantId]);
        }
    }
    async releaseStock(items) {
        const pool = getPool();
        for (const item of items) {
            await pool.query(`UPDATE catalog.inventory
         SET reserved = GREATEST(reserved - $1, 0), updated_at = NOW()
         WHERE variant_id = $2`, [item.quantity, item.variantId]);
        }
    }
}
export const productService = new ProductService();
