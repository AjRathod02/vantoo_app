import { getPool } from "../db/pool.js";
import type { CatalogCategory, CustomerAddress } from "@vantoo/shared";
import type { AddressInput } from "@vantoo/shared";
import { AppError } from "../utils/errors.js";

export class CategoryService {
  async list(service?: string): Promise<CatalogCategory[]> {
    const pool = getPool();
    const values: unknown[] = [];
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
  async list(userId: string): Promise<CustomerAddress[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM catalog.customer_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
    return result.rows.map(mapAddress);
  }

  async create(userId: string, input: AddressInput): Promise<CustomerAddress> {
    const pool = getPool();
    if (input.isDefault) {
      await pool.query(`UPDATE catalog.customer_addresses SET is_default = FALSE WHERE user_id = $1`, [userId]);
    }
    const result = await pool.query(
      `INSERT INTO catalog.customer_addresses
       (user_id, label, recipient_name, phone, line1, line2, landmark, city, state, pincode, latitude, longitude, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
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
      ]
    );
    return mapAddress(result.rows[0]);
  }

  async update(userId: string, id: string, input: Partial<AddressInput>): Promise<CustomerAddress> {
    const pool = getPool();
    const existing = await pool.query(`SELECT id FROM catalog.customer_addresses WHERE id = $1 AND user_id = $2`, [id, userId]);
    if (existing.rowCount === 0) throw AppError.notFound("Address not found");

    if (input.isDefault) {
      await pool.query(`UPDATE catalog.customer_addresses SET is_default = FALSE WHERE user_id = $1`, [userId]);
    }

    const fields: string[] = [];
    const values: unknown[] = [id, userId];
    let idx = 3;
    const mapping: Record<string, keyof AddressInput> = {
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
    if (fields.length === 0) throw AppError.validation("No fields to update");

    const result = await pool.query(
      `UPDATE catalog.customer_addresses SET ${fields.join(", ")}, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      values
    );
    return mapAddress(result.rows[0]);
  }

  async remove(userId: string, id: string): Promise<void> {
    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM catalog.customer_addresses WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (result.rowCount === 0) throw AppError.notFound("Address not found");
  }
}

function mapAddress(row: Record<string, unknown>): CustomerAddress {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    label: row.label as string,
    recipientName: row.recipient_name as string,
    phone: row.phone as string,
    line1: row.line1 as string,
    line2: row.line2 as string,
    landmark: row.landmark as string,
    city: row.city as string,
    state: row.state as string,
    pincode: row.pincode as string,
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    isDefault: row.is_default as boolean,
  };
}

export const categoryService = new CategoryService();
export const addressService = new AddressService();
