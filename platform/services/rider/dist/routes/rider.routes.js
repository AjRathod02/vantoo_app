import { riderApplySchema, riderUpdateSchema, riderDocumentSchema, riderAvailabilitySchema, riderLocationSchema, riderRejectSchema, riderOrderStatusSchema, acceptDeliverySchema, deliveryProofSchema, } from "@vantoo/shared";
import { riderService } from "../services/rider.service.js";
import { documentService } from "../services/document.service.js";
import { deliveryService } from "../services/delivery.service.js";
import { internalAuth, requireUser } from "../middleware/auth.middleware.js";
import { AppError } from "../utils/errors.js";
import { ErrorCodes } from "@vantoo/shared";
async function requireRider(request) {
    const userId = requireUser(request);
    const rider = await riderService.getByUserId(userId);
    if (!rider)
        throw AppError.notFound("Rider profile not found. Please apply first.");
    return rider;
}
async function requireApprovedRider(request) {
    const rider = await requireRider(request);
    if (rider.status !== "approved") {
        throw AppError.forbidden(`Rider account is ${rider.status}. Complete onboarding first.`);
    }
    return rider;
}
export async function riderRoutes(app) {
    app.get("/v1/riders/me", { preHandler: internalAuth }, async (request, reply) => {
        const userId = requireUser(request);
        const rider = await riderService.getByUserId(userId);
        if (!rider)
            return reply.send({ success: true, data: null });
        const [stats, availability] = await Promise.all([
            rider.status === "approved" ? riderService.getDashboardStats(rider.id) : null,
            riderService.getAvailability(rider.id).catch(() => null),
        ]);
        return reply.send({ success: true, data: { rider, stats, availability } });
    });
    app.post("/v1/riders/apply", { preHandler: internalAuth }, async (request, reply) => {
        const userId = requireUser(request);
        const input = riderApplySchema.parse(request.body);
        const rider = await riderService.apply(userId, input);
        return reply.status(201).send({ success: true, data: rider });
    });
    app.patch("/v1/riders/me", { preHandler: internalAuth }, async (request, reply) => {
        const userId = requireUser(request);
        const input = riderUpdateSchema.parse(request.body);
        const rider = await riderService.update(userId, input);
        return reply.send({ success: true, data: rider });
    });
    app.get("/v1/riders/documents", { preHandler: internalAuth }, async (request, reply) => {
        const rider = await requireRider(request);
        const docs = await documentService.list(rider.id);
        return reply.send({ success: true, data: docs });
    });
    app.post("/v1/riders/documents", { preHandler: internalAuth }, async (request, reply) => {
        const rider = await requireRider(request);
        const input = riderDocumentSchema.parse(request.body);
        const doc = await documentService.upload(rider.id, input);
        return reply.status(201).send({ success: true, data: doc });
    });
    app.put("/v1/riders/availability", { preHandler: internalAuth }, async (request, reply) => {
        const rider = await requireApprovedRider(request);
        const { status } = riderAvailabilitySchema.parse(request.body);
        const availability = await riderService.setAvailability(rider.id, status);
        return reply.send({ success: true, data: availability });
    });
    app.post("/v1/riders/location", { preHandler: internalAuth }, async (request, reply) => {
        const rider = await requireApprovedRider(request);
        const input = riderLocationSchema.parse(request.body);
        const location = await deliveryService.updateLocation(rider.id, rider.fullName, rider.phone, input);
        return reply.send({ success: true, data: location });
    });
    app.get("/v1/riders/deliveries/available", { preHandler: internalAuth }, async (request, reply) => {
        const rider = await requireApprovedRider(request);
        const availability = await riderService.getAvailability(rider.id);
        if (availability.status === "offline") {
            throw AppError.validation("Go online to see available deliveries");
        }
        const orders = await deliveryService.listAvailableOrders(rider.city);
        return reply.send({ success: true, data: orders.map((o) => ({
                id: o.id,
                orderNumber: o.order_number,
                status: o.status,
                totalAmount: Number(o.total_amount),
                deliveryAddress: o.delivery_address,
                serviceType: o.service_type,
                storeName: o.store_name,
                storeAddress: o.store_address,
                placedAt: o.created_at.toISOString(),
            })) });
    });
    app.get("/v1/riders/deliveries", { preHandler: internalAuth }, async (request, reply) => {
        const rider = await requireApprovedRider(request);
        const { active } = request.query;
        const tasks = await deliveryService.listRiderTasks(rider.id, active === "true");
        return reply.send({ success: true, data: tasks });
    });
    app.post("/v1/riders/deliveries/accept", { preHandler: internalAuth }, async (request, reply) => {
        const rider = await requireApprovedRider(request);
        const { orderId } = acceptDeliverySchema.parse(request.body);
        const task = await deliveryService.acceptOrder(rider.id, rider.fullName, rider.phone, orderId);
        return reply.status(201).send({ success: true, data: task });
    });
    app.patch("/v1/riders/deliveries/:orderId/status", { preHandler: internalAuth }, async (request, reply) => {
        const rider = await requireApprovedRider(request);
        const { orderId } = request.params;
        const { status } = riderOrderStatusSchema.parse(request.body);
        const result = await deliveryService.updateOrderStatus(rider.id, orderId, status, rider.fullName, rider.phone);
        return reply.send({ success: true, data: result });
    });
    app.post("/v1/riders/deliveries/:taskId/proof", { preHandler: internalAuth }, async (request, reply) => {
        const rider = await requireApprovedRider(request);
        const { taskId } = request.params;
        const input = deliveryProofSchema.parse(request.body);
        const proof = await deliveryService.addDeliveryProof(taskId, rider.id, input);
        return reply.status(201).send({ success: true, data: proof });
    });
    app.get("/v1/riders/earnings", { preHandler: internalAuth }, async (request, reply) => {
        const rider = await requireApprovedRider(request);
        const earnings = await deliveryService.listEarnings(rider.id);
        return reply.send({ success: true, data: earnings });
    });
    app.get("/v1/riders/tracking/orders/:orderId", { preHandler: internalAuth }, async (request, reply) => {
        const { orderId } = request.params;
        const tracking = await deliveryService.getTrackingForOrder(orderId);
        return reply.send({ success: true, data: tracking });
    });
    // Admin
    app.get("/v1/admin/riders", { preHandler: internalAuth }, async (request, reply) => {
        const { status } = request.query;
        const riders = await riderService.listAll(status);
        return reply.send({ success: true, data: riders });
    });
    app.post("/v1/admin/riders/:id/approve", { preHandler: internalAuth }, async (request, reply) => {
        const adminUserId = requireUser(request);
        const { id } = request.params;
        const rider = await riderService.approve(id, adminUserId);
        return reply.send({ success: true, data: rider });
    });
    app.post("/v1/admin/riders/:id/reject", { preHandler: internalAuth }, async (request, reply) => {
        const { id } = request.params;
        const { reason } = riderRejectSchema.parse(request.body);
        const rider = await riderService.reject(id, reason);
        return reply.send({ success: true, data: rider });
    });
    app.post("/v1/admin/riders/:id/suspend", { preHandler: internalAuth }, async (request, reply) => {
        const { id } = request.params;
        const rider = await riderService.suspend(id);
        return reply.send({ success: true, data: rider });
    });
    app.post("/v1/admin/rider-documents/:id/verify", { preHandler: internalAuth }, async (request, reply) => {
        const adminUserId = requireUser(request);
        const { id } = request.params;
        const doc = await documentService.verify(id, adminUserId);
        return reply.send({ success: true, data: doc });
    });
    app.get("/health", async () => ({ status: "ok", service: "rider-service" }));
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
