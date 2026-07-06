import { getPool } from "../db/pool.js";
import { loadEnv } from "../config/env.js";
import type { Rider, RiderApplyInput, RiderDashboardStats, RiderAvailability } from "@vantoo/shared";
import { AppError, slugify } from "../utils/errors.js";

function mapRider(row: Record<string, unknown>): Rider {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    fullName: row.full_name as string,
    slug: row.slug as string,
    phone: row.phone as string,
    email: row.email as string,
    status: row.status as Rider["status"],
    vehicleType: row.vehicle_type as Rider["vehicleType"],
    vehicleNumber: (row.vehicle_number as string) ?? null,
    city: row.city as string,
    state: row.state as string,
    pincode: row.pincode as string,
    bankAccount: (row.bank_account as Record<string, unknown>) ?? {},
    approvedAt: row.approved_at ? (row.approved_at as Date).toISOString() : null,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

async function notify(templateName: string, userId: string, variables: Record<string, string>) {
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
  } catch {
    // non-blocking
  }
}

async function assignRiderRole(userId: string) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO auth.user_roles (user_id, role_id)
     SELECT $1, id FROM auth.roles WHERE name = 'delivery_rider'
     ON CONFLICT (user_id, role_id) DO NOTHING`,
    [userId]
  );
}

export class RiderService {
  async getByUserId(userId: string): Promise<Rider | null> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM rider.riders WHERE user_id = $1 AND deleted_at IS NULL`,
      [userId]
    );
    return result.rows[0] ? mapRider(result.rows[0]) : null;
  }

  async getById(id: string): Promise<Rider> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM rider.riders WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (result.rows.length === 0) throw AppError.notFound("Rider not found");
    return mapRider(result.rows[0]);
  }

  async apply(userId: string, input: RiderApplyInput): Promise<Rider> {
    const existing = await this.getByUserId(userId);
    if (existing) throw AppError.conflict("You already have a rider application");

    const pool = getPool();
    const slug = slugify(input.fullName) + "-" + userId.slice(0, 8);

    const result = await pool.query(
      `INSERT INTO rider.riders (user_id, full_name, slug, phone, email, vehicle_type, vehicle_number, city, state, pincode, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending') RETURNING *`,
      [
        userId,
        input.fullName,
        slug,
        input.phone,
        input.email,
        input.vehicleType,
        input.vehicleNumber ?? null,
        input.city,
        input.state ?? "",
        input.pincode,
      ]
    );

    await pool.query(
      `INSERT INTO rider.rider_availability (rider_id, status) VALUES ($1, 'offline')`,
      [result.rows[0].id]
    );

    await assignRiderRole(userId);
    await notify("rider_application_submitted", userId, { fullName: input.fullName });
    return mapRider(result.rows[0]);
  }

  async update(userId: string, patch: Record<string, unknown>): Promise<Rider> {
    const rider = await this.getByUserId(userId);
    if (!rider) throw AppError.notFound("Rider profile not found");

    const pool = getPool();
    const fields: string[] = [];
    const values: unknown[] = [rider.id];
    let idx = 2;

    const mapping: Record<string, string> = {
      fullName: "full_name",
      phone: "phone",
      email: "email",
      vehicleType: "vehicle_type",
      vehicleNumber: "vehicle_number",
      city: "city",
      state: "state",
      pincode: "pincode",
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

    if (fields.length === 0) throw AppError.validation("No fields to update");

    const result = await pool.query(
      `UPDATE rider.riders SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    return mapRider(result.rows[0]);
  }

  async listAll(status?: string): Promise<Rider[]> {
    const pool = getPool();
    const values: unknown[] = [];
    let query = `SELECT * FROM rider.riders WHERE deleted_at IS NULL`;
    if (status) {
      query += ` AND status = $1`;
      values.push(status);
    }
    query += ` ORDER BY created_at DESC`;
    const result = await pool.query(query, values);
    return result.rows.map(mapRider);
  }

  async approve(riderId: string, adminUserId: string): Promise<Rider> {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE rider.riders SET status = 'approved', approved_at = NOW(), approved_by = $2, updated_at = NOW()
       WHERE id = $1 AND status IN ('pending', 'under_review') RETURNING *`,
      [riderId, adminUserId]
    );
    if (result.rows.length === 0) throw AppError.notFound("Rider not found or already processed");

    const rider = mapRider(result.rows[0]);
    await notify("rider_application_approved", rider.userId, { fullName: rider.fullName });
    return rider;
  }

  async reject(riderId: string, reason: string): Promise<Rider> {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE rider.riders SET status = 'rejected', metadata = jsonb_set(COALESCE(metadata, '{}'), '{rejectionReason}', $2::jsonb), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [riderId, JSON.stringify(reason)]
    );
    if (result.rows.length === 0) throw AppError.notFound("Rider not found");

    const rider = mapRider(result.rows[0]);
    await notify("rider_application_rejected", rider.userId, { reason });
    return rider;
  }

  async suspend(riderId: string): Promise<Rider> {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE rider.riders SET status = 'suspended', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [riderId]
    );
    if (result.rows.length === 0) throw AppError.notFound("Rider not found");
    await pool.query(
      `UPDATE rider.rider_availability SET status = 'offline', updated_at = NOW() WHERE rider_id = $1`,
      [riderId]
    );
    return mapRider(result.rows[0]);
  }

  async getAvailability(riderId: string): Promise<RiderAvailability> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM rider.rider_availability WHERE rider_id = $1`,
      [riderId]
    );
    if (result.rows.length === 0) throw AppError.notFound("Availability not found");
    const row = result.rows[0];
    return {
      riderId: row.rider_id as string,
      status: row.status as RiderAvailability["status"],
      updatedAt: (row.updated_at as Date).toISOString(),
    };
  }

  async setAvailability(riderId: string, status: RiderAvailability["status"]): Promise<RiderAvailability> {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE rider.rider_availability SET status = $2, updated_at = NOW() WHERE rider_id = $1 RETURNING *`,
      [riderId, status]
    );
    const row = result.rows[0];
    return {
      riderId: row.rider_id as string,
      status: row.status as RiderAvailability["status"],
      updatedAt: (row.updated_at as Date).toISOString(),
    };
  }

  async getDashboardStats(riderId: string): Promise<RiderDashboardStats> {
    const pool = getPool();
    const [deliveries, earnings] = await Promise.all([
      pool.query(
        `SELECT COUNT(*)::INT AS total,
                COUNT(*) FILTER (WHERE status IN ('accepted','picked','in_transit'))::INT AS active,
                COUNT(*) FILTER (WHERE status = 'delivered' AND delivered_at >= CURRENT_DATE)::INT AS today
         FROM rider.delivery_tasks WHERE rider_id = $1`,
        [riderId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount) FILTER (WHERE status IN ('pending','paid')), 0)::NUMERIC AS total,
                COALESCE(SUM(amount) FILTER (WHERE created_at >= CURRENT_DATE), 0)::NUMERIC AS today
         FROM rider.rider_earnings WHERE rider_id = $1`,
        [riderId]
      ),
    ]);

    return {
      totalDeliveries: deliveries.rows[0]?.total ?? 0,
      activeDeliveries: deliveries.rows[0]?.active ?? 0,
      todayDeliveries: deliveries.rows[0]?.today ?? 0,
      todayEarnings: Number(earnings.rows[0]?.today ?? 0),
      totalEarnings: Number(earnings.rows[0]?.total ?? 0),
      rating: 4.8,
    };
  }
}

export const riderService = new RiderService();
