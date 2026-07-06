import { getPool } from "../db/pool.js";
import { loadEnv } from "../config/env.js";
import type { DeliveryTask, OrderStatus } from "@vantoo/shared";
import { canTransition } from "@vantoo/shared";
import { AppError } from "../utils/errors.js";

function mapTask(row: Record<string, unknown>): DeliveryTask {
  return {
    id: row.id as string,
    orderId: row.order_id as string,
    riderId: row.rider_id as string,
    status: row.status as DeliveryTask["status"],
    assignedAt: (row.assigned_at as Date).toISOString(),
    acceptedAt: row.accepted_at ? (row.accepted_at as Date).toISOString() : null,
    pickedAt: row.picked_at ? (row.picked_at as Date).toISOString() : null,
    deliveredAt: row.delivered_at ? (row.delivered_at as Date).toISOString() : null,
    pickupAddress: (row.pickup_address as Record<string, unknown>) ?? {},
    deliveryAddress: (row.delivery_address as Record<string, unknown>) ?? {},
    isActive: row.is_active as boolean,
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

async function publishTracking(orderId: string, riderId: string, lat: number, lng: number, riderName: string, riderPhone: string) {
  const env = loadEnv();
  try {
    await fetch(`${env.TRACKING_SERVICE_URL}/v1/tracking/orders/${orderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": env.INTERNAL_SERVICE_KEY,
      },
      body: JSON.stringify({ riderId, riderName, riderPhone, latitude: lat, longitude: lng }),
    });
  } catch {
    // non-blocking
  }
}

export class DeliveryService {
  async listAvailableOrders(city?: string) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT o.*, s.name AS store_name, s.address_line1 AS store_address, s.city AS store_city,
              s.latitude AS store_lat, s.longitude AS store_lng
       FROM orders.orders o
       LEFT JOIN vendor.stores s ON s.id = o.store_id
       WHERE o.status = 'packed'
         AND NOT EXISTS (
           SELECT 1 FROM orders.order_assignments oa
           WHERE oa.order_id = o.id AND oa.is_active = TRUE
         )
       ORDER BY o.created_at ASC
       LIMIT 30`
    );
    return result.rows;
  }

  async listRiderTasks(riderId: string, activeOnly = false) {
    const pool = getPool();
    let query = `
      SELECT dt.*, o.order_number, o.status AS order_status, o.total_amount, o.delivery_address,
             o.service_type, o.user_id AS customer_user_id
      FROM rider.delivery_tasks dt
      JOIN orders.orders o ON o.id = dt.order_id
      WHERE dt.rider_id = $1`;
    if (activeOnly) query += ` AND dt.is_active = TRUE AND dt.status NOT IN ('delivered','cancelled')`;
    query += ` ORDER BY dt.created_at DESC LIMIT 50`;

    const result = await pool.query(query, [riderId]);
    return result.rows.map((row) => ({
      task: mapTask(row),
      orderNumber: row.order_number as string,
      orderStatus: row.order_status as string,
      totalAmount: Number(row.total_amount),
      deliveryAddress: row.delivery_address,
      serviceType: row.service_type as string,
      customerUserId: row.customer_user_id as string,
    }));
  }

  async acceptOrder(riderId: string, riderName: string, riderPhone: string, orderId: string) {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const orderResult = await client.query(
        `SELECT * FROM orders.orders WHERE id = $1 FOR UPDATE`,
        [orderId]
      );
      if (orderResult.rows.length === 0) throw AppError.notFound("Order not found");
      const order = orderResult.rows[0];

      if (order.status !== "packed") {
        throw AppError.validation(`Order is ${order.status}, not available for pickup`);
      }

      const existing = await client.query(
        `SELECT id FROM orders.order_assignments WHERE order_id = $1 AND is_active = TRUE`,
        [orderId]
      );
      if (existing.rowCount && existing.rowCount > 0) {
        throw AppError.conflict("Order already assigned to another rider");
      }

      const storeResult = await client.query(
        `SELECT name, address_line1, city, latitude, longitude FROM vendor.stores WHERE id = $1`,
        [order.store_id]
      );
      const store = storeResult.rows[0] ?? {};

      await client.query(
        `INSERT INTO orders.order_assignments (order_id, rider_id, accepted_at)
         VALUES ($1, $2, NOW())`,
        [orderId, riderId]
      );

      const taskResult = await client.query(
        `INSERT INTO rider.delivery_tasks (order_id, rider_id, status, accepted_at, pickup_address, delivery_address)
         VALUES ($1, $2, 'accepted', NOW(), $3, $4) RETURNING *`,
        [
          orderId,
          riderId,
          JSON.stringify({
            storeName: store.name,
            line1: store.address_line1,
            city: store.city,
            lat: store.latitude,
            lng: store.longitude,
          }),
          order.delivery_address,
        ]
      );

      const fromStatus = order.status as OrderStatus;
      const toStatus: OrderStatus = "assigned";
      if (!canTransition(fromStatus, toStatus)) {
        throw AppError.validation(`Cannot transition from ${fromStatus} to ${toStatus}`);
      }

      await client.query(
        `UPDATE orders.orders SET status = 'assigned', updated_at = NOW() WHERE id = $1`,
        [orderId]
      );
      await client.query(
        `INSERT INTO orders.order_status_history (order_id, from_status, to_status, note)
         VALUES ($1, $2, $3, 'Rider accepted delivery')`,
        [orderId, fromStatus, toStatus]
      );

      await client.query(
        `UPDATE rider.rider_availability SET status = 'busy', updated_at = NOW() WHERE rider_id = $1`,
        [riderId]
      );

      await client.query("COMMIT");

      const task = mapTask(taskResult.rows[0]);
      await notify("order_rider_assigned", order.user_id as string, {
        orderNumber: order.order_number as string,
        riderName,
      });

      const lat = store.latitude ? Number(store.latitude) : 28.6139;
      const lng = store.longitude ? Number(store.longitude) : 77.209;
      await publishTracking(orderId, riderId, lat, lng, riderName, riderPhone);

      return task;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async updateOrderStatus(
    riderId: string,
    orderId: string,
    status: OrderStatus,
    riderName: string,
    riderPhone: string
  ) {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const taskResult = await client.query(
        `SELECT * FROM rider.delivery_tasks WHERE order_id = $1 AND rider_id = $2 AND is_active = TRUE FOR UPDATE`,
        [orderId, riderId]
      );
      if (taskResult.rows.length === 0) throw AppError.notFound("Active delivery not found");

      const orderResult = await client.query(
        `SELECT * FROM orders.orders WHERE id = $1 FOR UPDATE`,
        [orderId]
      );
      const order = orderResult.rows[0];
      const fromStatus = order.status as OrderStatus;

      if (!canTransition(fromStatus, status)) {
        throw AppError.validation(`Cannot transition from ${fromStatus} to ${status}`);
      }

      await client.query(
        `UPDATE orders.orders SET status = $2, updated_at = NOW(),
         delivered_at = CASE WHEN $2 = 'delivered' THEN NOW() ELSE delivered_at END
         WHERE id = $1`,
        [orderId, status]
      );
      await client.query(
        `INSERT INTO orders.order_status_history (order_id, from_status, to_status, note)
         VALUES ($1, $2, $3, 'Rider status update')`,
        [orderId, fromStatus, status]
      );

      const taskStatusMap: Record<string, string> = {
        picked: "picked",
        in_transit: "in_transit",
        delivered: "delivered",
        cancelled: "cancelled",
      };
      const taskStatus = taskStatusMap[status];
      if (taskStatus) {
        const timeCol =
          status === "picked" ? "picked_at" :
          status === "delivered" ? "delivered_at" : null;
        let taskUpdate = `UPDATE rider.delivery_tasks SET status = $2, updated_at = NOW()`;
        if (timeCol) taskUpdate += `, ${timeCol} = NOW()`;
        if (status === "delivered" || status === "cancelled") {
          taskUpdate += `, is_active = FALSE`;
        }
        taskUpdate += ` WHERE order_id = $1 AND rider_id = $3`;
        await client.query(taskUpdate, [orderId, taskStatus, riderId]);

        if (status === "picked") {
          await client.query(
            `UPDATE orders.order_assignments SET picked_at = NOW() WHERE order_id = $1 AND rider_id = $2 AND is_active = TRUE`,
            [orderId, riderId]
          );
        }
        if (status === "delivered") {
          await client.query(
            `UPDATE orders.order_assignments SET delivered_at = NOW(), is_active = FALSE WHERE order_id = $1 AND rider_id = $2`,
            [orderId, riderId]
          );
          await client.query(
            `INSERT INTO rider.rider_earnings (rider_id, order_id, amount, earning_type, status)
             VALUES ($1, $2, $3, 'delivery_fee', 'pending')`,
            [riderId, orderId, order.delivery_fee ?? 30]
          );
          await client.query(
            `UPDATE rider.rider_availability SET status = 'online', updated_at = NOW() WHERE rider_id = $1`,
            [riderId]
          );
        }
      }

      await client.query("COMMIT");

      if (status === "in_transit") {
        await notify("order_out_for_delivery", order.user_id as string, {
          orderNumber: order.order_number as string,
        });
      }

      const addr = order.delivery_address as { lat?: number; lng?: number };
      const lat = addr?.lat ?? 28.6139;
      const lng = addr?.lng ?? 77.209;
      await publishTracking(orderId, riderId, lat, lng, riderName, riderPhone);

      return { id: orderId, status };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async updateLocation(
    riderId: string,
    riderName: string,
    riderPhone: string,
    input: { latitude: number; longitude: number; heading?: number; speed?: number; accuracy?: number; orderId?: string }
  ) {
    const pool = getPool();
    await pool.query(
      `INSERT INTO rider.rider_locations (rider_id, latitude, longitude, heading, speed, accuracy)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [riderId, input.latitude, input.longitude, input.heading ?? null, input.speed ?? null, input.accuracy ?? null]
    );

    if (input.orderId) {
      await publishTracking(input.orderId, riderId, input.latitude, input.longitude, riderName, riderPhone);
    }

    return { riderId, latitude: input.latitude, longitude: input.longitude, recordedAt: new Date().toISOString() };
  }

  async getTrackingForOrder(orderId: string) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT r.id AS rider_id, r.full_name, r.phone,
              rl.latitude, rl.longitude, rl.recorded_at,
              o.status AS order_status
       FROM orders.order_assignments oa
       JOIN rider.riders r ON r.id = oa.rider_id
       LEFT JOIN LATERAL (
         SELECT latitude, longitude, recorded_at
         FROM rider.rider_locations
         WHERE rider_id = r.id
         ORDER BY recorded_at DESC LIMIT 1
       ) rl ON TRUE
       JOIN orders.orders o ON o.id = oa.order_id
       WHERE oa.order_id = $1 AND oa.is_active = TRUE
       LIMIT 1`,
      [orderId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      orderId,
      riderId: row.rider_id as string,
      riderName: row.full_name as string,
      riderPhone: row.phone as string,
      riderLat: row.latitude ? Number(row.latitude) : null,
      riderLng: row.longitude ? Number(row.longitude) : null,
      status: row.order_status as string,
      updatedAt: row.recorded_at ? (row.recorded_at as Date).toISOString() : new Date().toISOString(),
    };
  }

  async addDeliveryProof(taskId: string, riderId: string, input: { proofType: string; fileUrl: string }) {
    const pool = getPool();
    const task = await pool.query(
      `SELECT id FROM rider.delivery_tasks WHERE id = $1 AND rider_id = $2`,
      [taskId, riderId]
    );
    if (task.rows.length === 0) throw AppError.notFound("Delivery task not found");

    const result = await pool.query(
      `INSERT INTO rider.delivery_proofs (task_id, proof_type, file_url)
       VALUES ($1, $2, $3) RETURNING *`,
      [taskId, input.proofType, input.fileUrl]
    );
    return result.rows[0];
  }

  async listEarnings(riderId: string) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM rider.rider_earnings WHERE rider_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [riderId]
    );
    return result.rows.map((row) => ({
      id: row.id as string,
      riderId: row.rider_id as string,
      orderId: row.order_id as string | null,
      amount: Number(row.amount),
      earningType: row.earning_type as string,
      status: row.status as string,
      createdAt: (row.created_at as Date).toISOString(),
    }));
  }
}

export const deliveryService = new DeliveryService();
