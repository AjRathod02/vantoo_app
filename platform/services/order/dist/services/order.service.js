import { getPool } from "../db/pool.js";
import { loadEnv } from "../config/env.js";
import { canTransition } from "@vantoo/shared";
import { AppError } from "../utils/errors.js";
import { publishEvent, notifyOrderStatusChange } from "./events.service.js";
export class OrderService {
    async resolveProducts(items) {
        const pool = getPool();
        const snapshots = [];
        for (const item of items) {
            const result = await pool.query(`SELECT p.id, p.legacy_id, p.name, p.base_price, p.vendor_id, p.store_id, p.tax_rate,
                pv.id AS variant_id, COALESCE(pv.name, '') AS variant_name, pv.sku,
                pi.url AS image_url
         FROM catalog.products p
         JOIN catalog.product_variants pv ON pv.product_id = p.id
           AND (pv.id = $2 OR ($2 IS NULL AND pv.is_default = TRUE))
         LEFT JOIN catalog.product_images pi ON pi.product_id = p.id AND pi.is_primary = TRUE
         WHERE (p.id = $1 OR p.legacy_id = $1) AND p.deleted_at IS NULL AND p.status = 'active'
         LIMIT 1`, [item.productId, item.variantId ?? null]);
            if (result.rows.length === 0) {
                throw AppError.notFound(`Product not found: ${item.productId}`);
            }
            snapshots.push(result.rows[0]);
        }
        return snapshots;
    }
    mapOrder(row, items, history) {
        return {
            id: row.id,
            orderNumber: row.order_number,
            userId: row.user_id,
            storeId: row.store_id,
            vendorId: row.vendor_id,
            serviceType: row.service_type,
            status: row.status,
            deliveryType: row.delivery_type,
            items,
            subtotal: Number(row.subtotal),
            deliveryFee: Number(row.delivery_fee),
            packagingFee: Number(row.packaging_fee),
            taxAmount: Number(row.tax_amount),
            discountAmount: Number(row.discount_amount),
            walletAmount: Number(row.wallet_amount),
            totalAmount: Number(row.total_amount),
            paymentStatus: row.payment_status,
            paymentMethod: row.payment_method,
            couponCode: row.coupon_code,
            address: row.delivery_address,
            deliveryInstructions: row.delivery_instructions,
            estimatedDelivery: row.estimated_delivery ? row.estimated_delivery.toISOString() : null,
            deliveredAt: row.delivered_at ? row.delivered_at.toISOString() : null,
            cancelledAt: row.cancelled_at ? row.cancelled_at.toISOString() : null,
            placedAt: row.created_at.toISOString(),
            tracking: undefined,
            statusHistory: history,
        };
    }
    async create(userId, input) {
        const env = loadEnv();
        const pool = getPool();
        if (input.idempotencyKey) {
            const existing = await pool.query(`SELECT id FROM orders.orders WHERE metadata->>'idempotencyKey' = $1 AND user_id = $2`, [input.idempotencyKey, userId]);
            if (existing.rows.length > 0) {
                return this.getById(existing.rows[0].id, userId);
            }
        }
        if (input.paymentMethod !== "cod" && input.paymentStatus !== "paid") {
            throw AppError.validation("Payment verification required for online payments");
        }
        const products = await this.resolveProducts(input.items);
        let subtotal = 0;
        let taxAmount = 0;
        const orderItems = [];
        for (let i = 0; i < input.items.length; i++) {
            const item = input.items[i];
            const product = products[i];
            const unitPrice = Number(product.base_price);
            const lineTotal = unitPrice * item.quantity;
            const lineTax = lineTotal * (Number(product.tax_rate) / 100);
            subtotal += lineTotal;
            taxAmount += lineTax;
            orderItems.push({
                productId: product.id,
                variantId: product.variant_id,
                productName: product.name,
                variantName: product.variant_name,
                sku: product.sku,
                imageUrl: product.image_url,
                quantity: item.quantity,
                unitPrice,
                taxAmount: lineTax,
                totalPrice: lineTotal + lineTax,
            });
        }
        const deliveryFee = env.DELIVERY_FEE;
        const discountAmount = 0;
        const walletAmount = input.walletAmount ?? 0;
        const totalAmount = subtotal + deliveryFee + taxAmount - discountAmount - walletAmount;
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            for (const item of orderItems) {
                const stockResult = await client.query(`UPDATE catalog.inventory
           SET reserved = reserved + $1, updated_at = NOW()
           WHERE variant_id = $2 AND quantity - reserved >= $1
           RETURNING id`, [item.quantity, item.variantId]);
                if (stockResult.rowCount === 0) {
                    throw AppError.validation(`Insufficient stock for ${item.productName}`);
                }
            }
            const vendorId = products[0]?.vendor_id ?? null;
            const storeId = products[0]?.store_id ?? null;
            const orderResult = await client.query(`INSERT INTO orders.orders (
          user_id, store_id, vendor_id, service_type, status, delivery_type,
          subtotal, delivery_fee, tax_amount, discount_amount, wallet_amount, total_amount,
          payment_status, payment_method, coupon_code, delivery_address, delivery_instructions,
          metadata
        ) VALUES ($1,$2,$3,$4,'confirmed',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        RETURNING *`, [
                userId,
                storeId,
                vendorId,
                input.serviceType,
                input.deliveryType ?? "standard",
                subtotal,
                deliveryFee,
                taxAmount,
                discountAmount,
                walletAmount,
                totalAmount,
                input.paymentMethod === "cod" ? "pending" : (input.paymentStatus ?? "paid"),
                input.paymentMethod,
                input.couponCode ?? null,
                JSON.stringify(input.address),
                input.deliveryInstructions ?? "",
                JSON.stringify({
                    idempotencyKey: input.idempotencyKey,
                    razorpayOrderId: input.razorpayOrderId,
                    razorpayPaymentId: input.razorpayPaymentId,
                }),
            ]);
            const orderRow = orderResult.rows[0];
            for (const item of orderItems) {
                await client.query(`INSERT INTO orders.order_items (
            order_id, product_id, variant_id, product_name, variant_name, sku,
            image_url, quantity, unit_price, tax_amount, total_price
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`, [
                    orderRow.id,
                    item.productId,
                    item.variantId,
                    item.productName,
                    item.variantName,
                    item.sku,
                    item.imageUrl,
                    item.quantity,
                    item.unitPrice,
                    item.taxAmount,
                    item.totalPrice,
                ]);
                await client.query(`UPDATE catalog.inventory
           SET quantity = quantity - $1, reserved = GREATEST(reserved - $1, 0), updated_at = NOW()
           WHERE variant_id = $2`, [item.quantity, item.variantId]);
            }
            if (input.paymentMethod !== "cod") {
                await client.query(`INSERT INTO payments.payments (order_id, user_id, amount, method, status, gateway_order_id, gateway_payment_id, idempotency_key, paid_at)
           VALUES ($1,$2,$3,$4,'paid',$5,$6,$7,NOW())`, [
                    orderRow.id,
                    userId,
                    totalAmount,
                    input.paymentMethod,
                    input.razorpayOrderId ?? null,
                    input.razorpayPaymentId ?? null,
                    input.idempotencyKey ?? null,
                ]);
            }
            await client.query("COMMIT");
            const order = await this.getById(orderRow.id, userId);
            await publishEvent("order.created", { orderId: order.id, userId, status: order.status });
            await notifyOrderStatusChange({
                id: order.id,
                orderNumber: order.orderNumber,
                userId,
                status: order.status,
            });
            return order;
        }
        catch (e) {
            await client.query("ROLLBACK");
            throw e;
        }
        finally {
            client.release();
        }
    }
    async getById(id, userId) {
        const pool = getPool();
        const values = [id];
        let userFilter = "";
        if (userId) {
            userFilter = " AND o.user_id = $2";
            values.push(userId);
        }
        const orderResult = await pool.query(`SELECT o.* FROM orders.orders o
       WHERE (o.id = $1 OR o.order_number = $1)${userFilter}`, values);
        if (orderResult.rows.length === 0)
            throw AppError.notFound("Order not found");
        const itemsResult = await pool.query(`SELECT product_id, variant_id, product_name, variant_name, sku, image_url,
              quantity, unit_price, total_price
       FROM orders.order_items WHERE order_id = $1`, [orderResult.rows[0].id]);
        const historyResult = await pool.query(`SELECT id, from_status, to_status, note, created_at
       FROM orders.order_status_history WHERE order_id = $1 ORDER BY created_at`, [orderResult.rows[0].id]);
        const items = itemsResult.rows.map((r) => ({
            productId: r.product_id,
            variantId: r.variant_id,
            name: r.product_name,
            variantName: r.variant_name,
            sku: r.sku,
            image: r.image_url ?? "",
            price: Number(r.unit_price),
            quantity: r.quantity,
            totalPrice: Number(r.total_price),
        }));
        const history = historyResult.rows.map((h) => ({
            id: h.id,
            fromStatus: h.from_status,
            toStatus: h.to_status,
            note: h.note,
            createdAt: h.created_at.toISOString(),
        }));
        return this.mapOrder(orderResult.rows[0], items, history);
    }
    async list(userId) {
        const pool = getPool();
        const result = await pool.query(`SELECT id FROM orders.orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [userId]);
        return Promise.all(result.rows.map((r) => this.getById(r.id, userId)));
    }
    async cancel(id, userId, reason) {
        const order = await this.getById(id, userId);
        if (!canTransition(order.status, "cancelled")) {
            throw AppError.validation(`Cannot cancel order in status: ${order.status}`);
        }
        const pool = getPool();
        await pool.query(`UPDATE orders.orders SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = 'customer', cancel_note = $2
       WHERE id = $1`, [order.id, reason ?? ""]);
        for (const item of order.items) {
            if (item.variantId) {
                await pool.query(`UPDATE catalog.inventory SET quantity = quantity + $1, updated_at = NOW() WHERE variant_id = $2`, [item.quantity, item.variantId]);
            }
        }
        const updated = await this.getById(order.id, userId);
        await publishEvent("order.cancelled", { orderId: order.id, userId });
        await notifyOrderStatusChange({
            id: updated.id,
            orderNumber: updated.orderNumber,
            userId,
            status: "cancelled",
        });
        return updated;
    }
    async updateStatus(id, toStatus, changedBy) {
        const pool = getPool();
        const current = await pool.query(`SELECT status, user_id, order_number FROM orders.orders WHERE id = $1`, [id]);
        if (current.rows.length === 0)
            throw AppError.notFound("Order not found");
        const fromStatus = current.rows[0].status;
        if (!canTransition(fromStatus, toStatus)) {
            throw AppError.validation(`Invalid transition: ${fromStatus} → ${toStatus}`);
        }
        await pool.query(`UPDATE orders.orders SET status = $2, updated_at = NOW() WHERE id = $1`, [id, toStatus]);
        await pool.query(`INSERT INTO orders.order_status_history (order_id, from_status, to_status, changed_by, note)
       VALUES ($1, $2, $3, $4, 'Manual status update')`, [id, fromStatus, toStatus, changedBy ?? null]);
        const order = await this.getById(id);
        await publishEvent("order.status_changed", { orderId: id, fromStatus, toStatus });
        await notifyOrderStatusChange({
            id,
            orderNumber: current.rows[0].order_number,
            userId: current.rows[0].user_id,
            status: toStatus,
        });
        return order;
    }
}
export const orderService = new OrderService();
