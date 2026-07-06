import { getPool } from "../db/pool.js";
import { AppError } from "../utils/errors.js";
export class CategoryService {
    async list(service) {
        const pool = getPool();
        const values = [];
        let query = `
      SELECT id, name, slug, service_type, image_url, parent_id
      FROM catalog.categories WHERE is_active = TRUE
    `;
        if (service) {
            query += ` AND (service_type = $1 OR service_type IS NULL)`;
            values.push(service);
        }
        query += ` ORDER BY sort_order, name`;
        const result = await pool.query(query, values);
        return result.rows.map((r) => ({
            id: r.id,
            name: r.name,
            slug: r.slug,
            serviceType: r.service_type,
            imageUrl: r.image_url,
            parentId: r.parent_id,
        }));
    }
}
export class AddressService {
    async list(userId) {
        const pool = getPool();
        const result = await pool.query(`SELECT * FROM catalog.customer_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`, [userId]);
        return result.rows.map(mapAddress);
    }
    async create(userId, input) {
        const pool = getPool();
        if (input.isDefault) {
            await pool.query(`UPDATE catalog.customer_addresses SET is_default = FALSE WHERE user_id = $1`, [userId]);
        }
        const result = await pool.query(`INSERT INTO catalog.customer_addresses
       (user_id, label, recipient_name, phone, line1, line2, landmark, city, state, pincode, latitude, longitude, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`, [
            userId,
            input.label,
            input.recipientName ?? "",
            input.phone ?? "",
            input.line1,
            input.line2 ?? "",
            input.landmark ?? "",
            input.city,
            input.state ?? "",
            input.pincode,
            input.latitude ?? null,
            input.longitude ?? null,
            input.isDefault ?? false,
        ]);
        return mapAddress(result.rows[0]);
    }
    async update(userId, id, input) {
        const pool = getPool();
        const existing = await pool.query(`SELECT id FROM catalog.customer_addresses WHERE id = $1 AND user_id = $2`, [id, userId]);
        if (existing.rowCount === 0)
            throw AppError.notFound("Address not found");
        if (input.isDefault) {
            await pool.query(`UPDATE catalog.customer_addresses SET is_default = FALSE WHERE user_id = $1`, [userId]);
        }
        const fields = [];
        const values = [id, userId];
        let idx = 3;
        const mapping = {
            label: "label", recipient_name: "recipientName", phone: "phone",
            line1: "line1", line2: "line2", landmark: "landmark",
            city: "city", state: "state", pincode: "pincode",
            latitude: "latitude", longitude: "longitude", is_default: "isDefault",
        };
        for (const [col, key] of Object.entries(mapping)) {
            if (input[key] !== undefined) {
                fields.push(`${col} = $${idx++}`);
                values.push(input[key]);
            }
        }
        if (fields.length === 0)
            throw AppError.validation("No fields to update");
        const result = await pool.query(`UPDATE catalog.customer_addresses SET ${fields.join(", ")}, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`, values);
        return mapAddress(result.rows[0]);
    }
    async remove(userId, id) {
        const pool = getPool();
        const result = await pool.query(`DELETE FROM catalog.customer_addresses WHERE id = $1 AND user_id = $2`, [id, userId]);
        if (result.rowCount === 0)
            throw AppError.notFound("Address not found");
    }
}
function mapAddress(row) {
    return {
        id: row.id,
        userId: row.user_id,
        label: row.label,
        recipientName: row.recipient_name,
        phone: row.phone,
        line1: row.line1,
        line2: row.line2,
        landmark: row.landmark,
        city: row.city,
        state: row.state,
        pincode: row.pincode,
        latitude: row.latitude ? Number(row.latitude) : null,
        longitude: row.longitude ? Number(row.longitude) : null,
        isDefault: row.is_default,
    };
}
export const categoryService = new CategoryService();
export const addressService = new AddressService();
