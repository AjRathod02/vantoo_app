import { getPool } from "../db/pool.js";
import { loadEnv } from "../config/env.js";
import { AppError, slugify } from "../utils/errors.js";
const STORE_TYPE_TO_SERVICE = {
    restaurant: "food",
    grocery: "grocery",
    pharmacy: "medicine",
    ecommerce: "ecommerce",
    local_shop: "local_shop",
};
const STORE_TYPE_TO_ROLE = {
    restaurant: "restaurant_owner",
    grocery: "grocery_store",
    pharmacy: "grocery_store",
    ecommerce: "ecommerce_seller",
    local_shop: "vendor",
};
function mapVendor(row) {
    return {
        id: row.id,
        userId: row.user_id,
        businessName: row.business_name,
        legalName: row.legal_name,
        slug: row.slug,
        description: row.description,
        logoUrl: row.logo_url,
        status: row.status,
        commissionRate: Number(row.commission_rate),
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        gstNumber: row.gst_number,
        panNumber: row.pan_number,
        bankAccount: row.bank_account ?? {},
        approvedAt: row.approved_at ? row.approved_at.toISOString() : null,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
    };
}
async function notify(templateName, userId, variables) {
    const env = loadEnv();
    try {
        await fetch(`${env.NOTIFICATION_SERVICE_URL}/v1/notifications/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Internal-Key": env.INTERNAL_SERVICE_KEY,
                "X-User-Id": userId,
            },
            body: JSON.stringify({ userId, channel: "in_app", templateName, variables }),
        });
    }
    catch {
        // non-blocking
    }
}
async function assignVendorRole(userId, storeType) {
    const pool = getPool();
    const roleName = STORE_TYPE_TO_ROLE[storeType] ?? "vendor";
    await pool.query(`INSERT INTO auth.user_roles (user_id, role_id)
     SELECT $1, id FROM auth.roles WHERE name = $2
     ON CONFLICT (user_id, role_id) DO NOTHING`, [userId, roleName]);
    await pool.query(`INSERT INTO auth.user_roles (user_id, role_id)
     SELECT $1, id FROM auth.roles WHERE name = 'vendor'
     ON CONFLICT (user_id, role_id) DO NOTHING`, [userId]);
}
export class VendorService {
    async getByUserId(userId) {
        const pool = getPool();
        const result = await pool.query(`SELECT * FROM vendor.vendors WHERE user_id = $1 AND deleted_at IS NULL`, [userId]);
        return result.rows[0] ? mapVendor(result.rows[0]) : null;
    }
    async getById(id) {
        const pool = getPool();
        const result = await pool.query(`SELECT * FROM vendor.vendors WHERE id = $1 AND deleted_at IS NULL`, [id]);
        if (result.rows.length === 0)
            throw AppError.notFound("Vendor not found");
        return mapVendor(result.rows[0]);
    }
    async apply(userId, input) {
        const existing = await this.getByUserId(userId);
        if (existing)
            throw AppError.conflict("You already have a vendor application");
        const pool = getPool();
        const client = await pool.connect();
        const slug = slugify(input.businessName) + "-" + userId.slice(0, 8);
        const serviceType = STORE_TYPE_TO_SERVICE[input.storeType] ?? "ecommerce";
        try {
            await client.query("BEGIN");
            const vendorResult = await client.query(`INSERT INTO vendor.vendors (user_id, business_name, legal_name, slug, description, contact_email, contact_phone, gst_number, pan_number, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending') RETURNING *`, [
                userId,
                input.businessName,
                input.legalName ?? input.businessName,
                slug,
                input.description ?? "",
                input.contactEmail,
                input.contactPhone,
                input.gstNumber ?? null,
                input.panNumber ?? null,
            ]);
            const vendor = vendorResult.rows[0];
            await client.query(`INSERT INTO vendor.stores (vendor_id, name, slug, store_type, service_types, address_line1, city, state, pincode, is_active)
         VALUES ($1,$2,$3,$4,ARRAY[$5]::catalog.service_type[],$6,$7,$8,$9,FALSE)`, [
                vendor.id,
                input.storeName,
                slugify(input.storeName),
                input.storeType,
                serviceType,
                input.addressLine1,
                input.city,
                input.state ?? "",
                input.pincode,
            ]);
            await assignVendorRole(userId, input.storeType);
            await client.query("COMMIT");
            await notify("vendor_application_submitted", userId, { businessName: input.businessName });
            return mapVendor(vendor);
        }
        catch (e) {
            await client.query("ROLLBACK");
            throw e;
        }
        finally {
            client.release();
        }
    }
    async update(userId, patch) {
        const vendor = await this.getByUserId(userId);
        if (!vendor)
            throw AppError.notFound("Vendor profile not found");
        const pool = getPool();
        const fields = [];
        const values = [vendor.id];
        let idx = 2;
        const mapping = {
            businessName: "business_name",
            legalName: "legal_name",
            description: "description",
            contactEmail: "contact_email",
            contactPhone: "contact_phone",
            gstNumber: "gst_number",
            panNumber: "pan_number",
            logoUrl: "logo_url",
        };
        for (const [key, col] of Object.entries(mapping)) {
            if (patch[key] !== undefined) {
                fields.push(`${col} = $${idx++}`);
                values.push(patch[key]);
            }
        }
        if (patch.bankAccount !== undefined) {
            fields.push(`bank_account = $${idx++}`);
            values.push(JSON.stringify(patch.bankAccount));
        }
        if (fields.length === 0)
            throw AppError.validation("No fields to update");
        const result = await pool.query(`UPDATE vendor.vendors SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $1 RETURNING *`, values);
        return mapVendor(result.rows[0]);
    }
    async listAll(status) {
        const pool = getPool();
        const values = [];
        let query = `SELECT * FROM vendor.vendors WHERE deleted_at IS NULL`;
        if (status) {
            query += ` AND status = $1`;
            values.push(status);
        }
        query += ` ORDER BY created_at DESC`;
        const result = await pool.query(query, values);
        return result.rows.map(mapVendor);
    }
    async approve(vendorId, adminUserId) {
        const pool = getPool();
        const result = await pool.query(`UPDATE vendor.vendors SET status = 'approved', approved_at = NOW(), approved_by = $2, updated_at = NOW()
       WHERE id = $1 AND status IN ('pending', 'under_review') RETURNING *`, [vendorId, adminUserId]);
        if (result.rows.length === 0)
            throw AppError.notFound("Vendor not found or already processed");
        await pool.query(`UPDATE vendor.stores SET is_active = TRUE, updated_at = NOW() WHERE vendor_id = $1`, [vendorId]);
        const vendor = mapVendor(result.rows[0]);
        await notify("vendor_application_approved", vendor.userId, { businessName: vendor.businessName });
        return vendor;
    }
    async reject(vendorId, reason) {
        const pool = getPool();
        const result = await pool.query(`UPDATE vendor.vendors SET status = 'rejected', metadata = jsonb_set(COALESCE(metadata, '{}'), '{rejectionReason}', $2::jsonb), updated_at = NOW()
       WHERE id = $1 RETURNING *`, [vendorId, JSON.stringify(reason)]);
        if (result.rows.length === 0)
            throw AppError.notFound("Vendor not found");
        const vendor = mapVendor(result.rows[0]);
        await notify("vendor_application_rejected", vendor.userId, {
            businessName: vendor.businessName,
            reason,
        });
        return vendor;
    }
    async suspend(vendorId) {
        const pool = getPool();
        const result = await pool.query(`UPDATE vendor.vendors SET status = 'suspended', updated_at = NOW() WHERE id = $1 RETURNING *`, [vendorId]);
        if (result.rows.length === 0)
            throw AppError.notFound("Vendor not found");
        await pool.query(`UPDATE vendor.stores SET is_active = FALSE WHERE vendor_id = $1`, [vendorId]);
        return mapVendor(result.rows[0]);
    }
    async getDashboardStats(vendorId) {
        const pool = getPool();
        const [orders, products, stores] = await Promise.all([
            pool.query(`SELECT COUNT(*)::INT AS total,
                COUNT(*) FILTER (WHERE status IN ('confirmed','preparing','packed','assigned','picked','in_transit'))::INT AS pending,
                COALESCE(SUM(total_amount) FILTER (WHERE status = 'delivered'), 0)::NUMERIC AS revenue
         FROM orders.orders WHERE vendor_id = $1`, [vendorId]),
            pool.query(`SELECT COUNT(*)::INT AS total,
                COUNT(*) FILTER (WHERE status = 'active')::INT AS active
         FROM catalog.products WHERE vendor_id = $1 AND deleted_at IS NULL`, [vendorId]),
            pool.query(`SELECT COUNT(*)::INT AS count FROM vendor.stores WHERE vendor_id = $1 AND deleted_at IS NULL`, [vendorId]),
        ]);
        return {
            totalOrders: orders.rows[0]?.total ?? 0,
            pendingOrders: orders.rows[0]?.pending ?? 0,
            revenue: Number(orders.rows[0]?.revenue ?? 0),
            totalProducts: products.rows[0]?.total ?? 0,
            activeProducts: products.rows[0]?.active ?? 0,
            storeCount: stores.rows[0]?.count ?? 0,
        };
    }
}
export const vendorService = new VendorService();
