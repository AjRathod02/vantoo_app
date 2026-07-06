import { getPool } from "../db/pool.js";
import type { Store, StoreTiming, VendorDocument } from "@vantoo/shared";
import { AppError, slugify } from "../utils/errors.js";

function mapStore(row: Record<string, unknown>): Store {
  return {
    id: row.id as string,
    vendorId: row.vendor_id as string,
    name: row.name as string,
    slug: row.slug as string,
    storeType: row.store_type as Store["storeType"],
    serviceTypes: (row.service_types as string[]) ?? [],
    description: row.description as string,
    imageUrl: row.image_url as string | null,
    addressLine1: row.address_line1 as string,
    addressLine2: row.address_line2 as string,
    city: row.city as string,
    state: row.state as string,
    pincode: row.pincode as string,
    latitude: row.latitude ? Number(row.latitude) : null,
    longitude: row.longitude ? Number(row.longitude) : null,
    deliveryRadiusKm: Number(row.delivery_radius_km),
    minOrderAmount: Number(row.min_order_amount),
    avgDeliveryMins: Number(row.avg_delivery_mins),
    rating: Number(row.rating),
    reviewCount: Number(row.review_count),
    isActive: row.is_active as boolean,
    isFeatured: row.is_featured as boolean,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export class StoreService {
  async listByVendor(vendorId: string): Promise<Store[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM vendor.stores WHERE vendor_id = $1 AND deleted_at IS NULL ORDER BY created_at`,
      [vendorId]
    );
    return result.rows.map(mapStore);
  }

  async create(vendorId: string, input: Record<string, unknown>): Promise<Store> {
    const pool = getPool();
    const slug = slugify(input.name as string);
    const result = await pool.query(
      `INSERT INTO vendor.stores (
        vendor_id, name, slug, store_type, service_types, description, image_url,
        address_line1, address_line2, city, state, pincode, latitude, longitude,
        delivery_radius_km, min_order_amount, avg_delivery_mins, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,FALSE)
      RETURNING *`,
      [
        vendorId,
        input.name,
        slug,
        input.storeType,
        input.serviceTypes,
        input.description ?? "",
        input.imageUrl ?? null,
        input.addressLine1,
        input.addressLine2 ?? "",
        input.city,
        input.state ?? "",
        input.pincode,
        input.latitude ?? null,
        input.longitude ?? null,
        input.deliveryRadiusKm ?? 5,
        input.minOrderAmount ?? 0,
        input.avgDeliveryMins ?? 30,
      ]
    );
    return mapStore(result.rows[0]);
  }

  async update(vendorId: string, storeId: string, input: Record<string, unknown>): Promise<Store> {
    const pool = getPool();
    const existing = await pool.query(
      `SELECT id FROM vendor.stores WHERE id = $1 AND vendor_id = $2 AND deleted_at IS NULL`,
      [storeId, vendorId]
    );
    if (existing.rowCount === 0) throw AppError.notFound("Store not found");

    const fields: string[] = [];
    const values: unknown[] = [storeId, vendorId];
    let idx = 3;
    const mapping: Record<string, string> = {
      name: "name", description: "description", imageUrl: "image_url",
      addressLine1: "address_line1", addressLine2: "address_line2",
      city: "city", state: "state", pincode: "pincode",
      latitude: "latitude", longitude: "longitude",
      deliveryRadiusKm: "delivery_radius_km", minOrderAmount: "min_order_amount",
      avgDeliveryMins: "avg_delivery_mins", isActive: "is_active",
    };

    for (const [key, col] of Object.entries(mapping)) {
      if (input[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(input[key]);
      }
    }

    const result = await pool.query(
      `UPDATE vendor.stores SET ${fields.join(", ")}, updated_at = NOW()
       WHERE id = $1 AND vendor_id = $2 RETURNING *`,
      values
    );
    return mapStore(result.rows[0]);
  }

  async setTimings(vendorId: string, storeId: string, timings: Array<Record<string, unknown>>): Promise<StoreTiming[]> {
    const pool = getPool();
    const store = await pool.query(
      `SELECT id FROM vendor.stores WHERE id = $1 AND vendor_id = $2`,
      [storeId, vendorId]
    );
    if (store.rowCount === 0) throw AppError.notFound("Store not found");

    await pool.query(`DELETE FROM vendor.store_timings WHERE store_id = $1`, [storeId]);

    const results: StoreTiming[] = [];
    for (const t of timings) {
      const r = await pool.query(
        `INSERT INTO vendor.store_timings (store_id, day_of_week, open_time, close_time, is_closed)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [storeId, t.dayOfWeek, t.openTime, t.closeTime, t.isClosed ?? false]
      );
      results.push({
        id: r.rows[0].id,
        storeId,
        dayOfWeek: r.rows[0].day_of_week,
        openTime: r.rows[0].open_time,
        closeTime: r.rows[0].close_time,
        isClosed: r.rows[0].is_closed,
      });
    }
    return results;
  }

  async getTimings(storeId: string): Promise<StoreTiming[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM vendor.store_timings WHERE store_id = $1 ORDER BY day_of_week`,
      [storeId]
    );
    return result.rows.map((r) => ({
      id: r.id,
      storeId: r.store_id,
      dayOfWeek: r.day_of_week,
      openTime: r.open_time,
      closeTime: r.close_time,
      isClosed: r.is_closed,
    }));
  }
}

export class DocumentService {
  async list(vendorId: string): Promise<VendorDocument[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM vendor.vendor_documents WHERE vendor_id = $1 ORDER BY created_at DESC`,
      [vendorId]
    );
    return result.rows.map(mapDocument);
  }

  async upload(vendorId: string, input: Record<string, unknown>): Promise<VendorDocument> {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO vendor.vendor_documents (vendor_id, document_type, document_number, file_url, expires_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [vendorId, input.documentType, input.documentNumber ?? null, input.fileUrl, input.expiresAt ?? null]
    );

    await pool.query(
      `UPDATE vendor.vendors SET status = 'under_review', updated_at = NOW()
       WHERE id = $1 AND status = 'pending'`,
      [vendorId]
    );

    return mapDocument(result.rows[0]);
  }

  async verify(documentId: string, adminUserId: string): Promise<VendorDocument> {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE vendor.vendor_documents SET status = 'verified', verified_at = NOW(), verified_by = $2
       WHERE id = $1 RETURNING *`,
      [documentId, adminUserId]
    );
    if (result.rows.length === 0) throw AppError.notFound("Document not found");
    return mapDocument(result.rows[0]);
  }

  async reject(documentId: string, adminUserId: string, reason: string): Promise<VendorDocument> {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE vendor.vendor_documents SET status = 'rejected', verified_by = $2, rejection_reason = $3
       WHERE id = $1 RETURNING *`,
      [documentId, adminUserId, reason]
    );
    if (result.rows.length === 0) throw AppError.notFound("Document not found");
    return mapDocument(result.rows[0]);
  }
}

function mapDocument(row: Record<string, unknown>): VendorDocument {
  return {
    id: row.id as string,
    vendorId: row.vendor_id as string,
    documentType: row.document_type as VendorDocument["documentType"],
    documentNumber: row.document_number as string | null,
    fileUrl: row.file_url as string,
    status: row.status as VendorDocument["status"],
    rejectionReason: row.rejection_reason as string | null,
    verifiedAt: row.verified_at ? (row.verified_at as Date).toISOString() : null,
    expiresAt: row.expires_at ? (row.expires_at as Date).toISOString() : null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export const storeService = new StoreService();
export const documentService = new DocumentService();
