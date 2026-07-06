import type { FastifyInstance } from "fastify";
import {
  vendorApplySchema,
  vendorUpdateSchema,
  documentUploadSchema,
  storeCreateSchema,
  storeUpdateSchema,
  storeTimingSchema,
  vendorProductSchema,
  vendorProductUpdateSchema,
  vendorRejectSchema,
  vendorOrderStatusSchema,
} from "@vantoo/shared";
import { vendorService } from "../services/vendor.service.js";
import { storeService, documentService } from "../services/store.service.js";
import { vendorProductService } from "../services/product.service.js";
import { internalAuth, requireUser } from "../middleware/auth.middleware.js";
import { AppError } from "../utils/errors.js";
import { ErrorCodes } from "@vantoo/shared";
import { getPool } from "../db/pool.js";
import type { Order, OrderStatus } from "@vantoo/shared";
import { canTransition } from "@vantoo/shared";

async function requireVendor(request: import("fastify").FastifyRequest) {
  const userId = requireUser(request);
  const vendor = await vendorService.getByUserId(userId);
  if (!vendor) throw AppError.notFound("Vendor profile not found. Please apply first.");
  return vendor;
}

async function requireApprovedVendor(request: import("fastify").FastifyRequest) {
  const vendor = await requireVendor(request);
  if (vendor.status !== "approved") {
    throw AppError.forbidden(`Vendor account is ${vendor.status}. Complete onboarding first.`);
  }
  return vendor;
}

export async function vendorRoutes(app: FastifyInstance) {
  // --- Vendor profile ---
  app.get("/v1/vendors/me", { preHandler: internalAuth }, async (request, reply) => {
    const userId = requireUser(request);
    const vendor = await vendorService.getByUserId(userId);
    if (!vendor) return reply.send({ success: true, data: null });
    const stats = vendor.status === "approved"
      ? await vendorService.getDashboardStats(vendor.id)
      : null;
    return reply.send({ success: true, data: { vendor, stats } });
  });

  app.post("/v1/vendors/apply", { preHandler: internalAuth }, async (request, reply) => {
    const userId = requireUser(request);
    const input = vendorApplySchema.parse(request.body);
    const vendor = await vendorService.apply(userId, input);
    return reply.status(201).send({ success: true, data: vendor });
  });

  app.patch("/v1/vendors/me", { preHandler: internalAuth }, async (request, reply) => {
    const userId = requireUser(request);
    const input = vendorUpdateSchema.parse(request.body);
    const vendor = await vendorService.update(userId, input);
    return reply.send({ success: true, data: vendor });
  });

  // --- Documents ---
  app.get("/v1/vendors/documents", { preHandler: internalAuth }, async (request, reply) => {
    const vendor = await requireVendor(request);
    const docs = await documentService.list(vendor.id);
    return reply.send({ success: true, data: docs });
  });

  app.post("/v1/vendors/documents", { preHandler: internalAuth }, async (request, reply) => {
    const vendor = await requireVendor(request);
    const input = documentUploadSchema.parse(request.body);
    const doc = await documentService.upload(vendor.id, input);
    return reply.status(201).send({ success: true, data: doc });
  });

  // --- Stores ---
  app.get("/v1/vendors/stores", { preHandler: internalAuth }, async (request, reply) => {
    const vendor = await requireVendor(request);
    const stores = await storeService.listByVendor(vendor.id);
    return reply.send({ success: true, data: stores });
  });

  app.post("/v1/vendors/stores", { preHandler: internalAuth }, async (request, reply) => {
    const vendor = await requireApprovedVendor(request);
    const input = storeCreateSchema.parse(request.body);
    const store = await storeService.create(vendor.id, input);
    return reply.status(201).send({ success: true, data: store });
  });

  app.patch("/v1/vendors/stores/:storeId", { preHandler: internalAuth }, async (request, reply) => {
    const vendor = await requireApprovedVendor(request);
    const { storeId } = request.params as { storeId: string };
    const input = storeUpdateSchema.parse(request.body);
    const store = await storeService.update(vendor.id, storeId, input);
    return reply.send({ success: true, data: store });
  });

  app.put("/v1/vendors/stores/:storeId/timings", { preHandler: internalAuth }, async (request, reply) => {
    const vendor = await requireApprovedVendor(request);
    const { storeId } = request.params as { storeId: string };
    const { timings } = request.body as { timings: unknown[] };
    const parsed = timings.map((t) => storeTimingSchema.parse(t));
    const result = await storeService.setTimings(vendor.id, storeId, parsed);
    return reply.send({ success: true, data: result });
  });

  app.get("/v1/vendors/stores/:storeId/timings", { preHandler: internalAuth }, async (request, reply) => {
    await requireVendor(request);
    const { storeId } = request.params as { storeId: string };
    const timings = await storeService.getTimings(storeId);
    return reply.send({ success: true, data: timings });
  });

  // --- Products ---
  app.get("/v1/vendors/products", { preHandler: internalAuth }, async (request, reply) => {
    const vendor = await requireVendor(request);
    const products = await vendorProductService.list(vendor.id);
    return reply.send({ success: true, data: products });
  });

  app.post("/v1/vendors/products", { preHandler: internalAuth }, async (request, reply) => {
    const vendor = await requireApprovedVendor(request);
    const input = vendorProductSchema.parse(request.body);
    const product = await vendorProductService.create(vendor.id, input);
    return reply.status(201).send({ success: true, data: product });
  });

  app.patch("/v1/vendors/products/:productId", { preHandler: internalAuth }, async (request, reply) => {
    const vendor = await requireApprovedVendor(request);
    const { productId } = request.params as { productId: string };
    const input = vendorProductUpdateSchema.parse(request.body);
    const product = await vendorProductService.update(vendor.id, productId, input);
    return reply.send({ success: true, data: product });
  });

  app.post("/v1/vendors/products/:productId/publish", { preHandler: internalAuth }, async (request, reply) => {
    const vendor = await requireApprovedVendor(request);
    const { productId } = request.params as { productId: string };
    const product = await vendorProductService.publish(vendor.id, productId);
    return reply.send({ success: true, data: product });
  });

  app.delete("/v1/vendors/products/:productId", { preHandler: internalAuth }, async (request, reply) => {
    const vendor = await requireApprovedVendor(request);
    const { productId } = request.params as { productId: string };
    await vendorProductService.remove(vendor.id, productId);
    return reply.send({ success: true, data: { message: "Product removed" } });
  });

  // --- Vendor orders ---
  app.get("/v1/vendors/orders", { preHandler: internalAuth }, async (request, reply) => {
    const vendor = await requireApprovedVendor(request);
    const pool = getPool();
    const result = await pool.query(
      `SELECT id FROM orders.orders WHERE vendor_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [vendor.id]
    );
    const orders: Order[] = [];
    for (const row of result.rows) {
      const orderResult = await pool.query(`SELECT * FROM orders.orders WHERE id = $1`, [row.id]);
      const itemsResult = await pool.query(`SELECT * FROM orders.order_items WHERE order_id = $1`, [row.id]);
      const o = orderResult.rows[0];
      orders.push({
        id: o.id,
        orderNumber: o.order_number,
        userId: o.user_id,
        storeId: o.store_id,
        vendorId: o.vendor_id,
        serviceType: o.service_type,
        status: o.status,
        deliveryType: o.delivery_type,
        items: itemsResult.rows.map((i) => ({
          productId: i.product_id,
          variantId: i.variant_id,
          name: i.product_name,
          image: i.image_url ?? "",
          price: Number(i.unit_price),
          quantity: i.quantity,
        })),
        subtotal: Number(o.subtotal),
        deliveryFee: Number(o.delivery_fee),
        packagingFee: Number(o.packaging_fee),
        taxAmount: Number(o.tax_amount),
        discountAmount: Number(o.discount_amount),
        walletAmount: Number(o.wallet_amount),
        totalAmount: Number(o.total_amount),
        paymentStatus: o.payment_status,
        paymentMethod: o.payment_method,
        couponCode: o.coupon_code,
        address: o.delivery_address,
        estimatedDelivery: null,
        deliveredAt: o.delivered_at?.toISOString() ?? null,
        cancelledAt: o.cancelled_at?.toISOString() ?? null,
        placedAt: o.created_at.toISOString(),
      });
    }
    return reply.send({ success: true, data: orders });
  });

  app.patch("/v1/vendors/orders/:orderId/status", { preHandler: internalAuth }, async (request, reply) => {
    const vendor = await requireApprovedVendor(request);
    const { orderId } = request.params as { orderId: string };
    const { status } = vendorOrderStatusSchema.parse(request.body);

    const pool = getPool();
    const current = await pool.query(
      `SELECT status FROM orders.orders WHERE id = $1 AND vendor_id = $2`,
      [orderId, vendor.id]
    );
    if (current.rowCount === 0) throw AppError.notFound("Order not found");

    const fromStatus = current.rows[0].status as OrderStatus;
    if (!canTransition(fromStatus, status as OrderStatus)) {
      throw AppError.validation(`Cannot transition from ${fromStatus} to ${status}`);
    }

    await pool.query(`UPDATE orders.orders SET status = $2, updated_at = NOW() WHERE id = $1`, [orderId, status]);
    await pool.query(
      `INSERT INTO orders.order_status_history (order_id, from_status, to_status, note)
       VALUES ($1, $2, $3, 'Vendor status update')`,
      [orderId, fromStatus, status]
    );

    return reply.send({ success: true, data: { id: orderId, status } });
  });

  // --- Admin ---
  app.get("/v1/admin/vendors", { preHandler: internalAuth }, async (request, reply) => {
    const { status } = request.query as { status?: string };
    const vendors = await vendorService.listAll(status);
    return reply.send({ success: true, data: vendors });
  });

  app.post("/v1/admin/vendors/:id/approve", { preHandler: internalAuth }, async (request, reply) => {
    const adminUserId = requireUser(request);
    const { id } = request.params as { id: string };
    const vendor = await vendorService.approve(id, adminUserId);
    return reply.send({ success: true, data: vendor });
  });

  app.post("/v1/admin/vendors/:id/reject", { preHandler: internalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason } = vendorRejectSchema.parse(request.body);
    const vendor = await vendorService.reject(id, reason);
    return reply.send({ success: true, data: vendor });
  });

  app.post("/v1/admin/vendors/:id/suspend", { preHandler: internalAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const vendor = await vendorService.suspend(id);
    return reply.send({ success: true, data: vendor });
  });

  app.post("/v1/admin/documents/:id/verify", { preHandler: internalAuth }, async (request, reply) => {
    const adminUserId = requireUser(request);
    const { id } = request.params as { id: string };
    const doc = await documentService.verify(id, adminUserId);
    return reply.send({ success: true, data: doc });
  });

  app.get("/health", async () => ({ status: "ok", service: "vendor-service" }));

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: { code: error.code, message: error.message },
      });
    }
    return reply.status(500).send({
      success: false,
      error: { code: ErrorCodes.INTERNAL_ERROR, message: "Internal error" },
    });
  });
}
