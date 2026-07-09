import { createOrderSchema, cancelOrderSchema } from "@vantoo/shared";
import { orderService } from "../services/order.service.js";
import { loadEnv } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { ErrorCodes } from "@vantoo/shared";
async function internalAuth(request) {
    const key = request.headers["x-internal-key"];
    if (key !== loadEnv().INTERNAL_SERVICE_KEY) {
        throw AppError.forbidden("Invalid internal service key");
    }
    const userId = request.headers["x-user-id"];
    if (typeof userId === "string")
        request.userId = userId;
}
function requireUser(request) {
    if (!request.userId)
        throw AppError.forbidden("User ID required");
    return request.userId;
}
export async function orderRoutes(app) {
    app.post("/v1/orders", { preHandler: internalAuth }, async (request, reply) => {
        const userId = requireUser(request);
        const input = createOrderSchema.parse(request.body);
        const order = await orderService.create(userId, input);
        return reply.status(201).send({ success: true, data: order });
    });
    app.get("/v1/orders", { preHandler: internalAuth }, async (request, reply) => {
        const userId = requireUser(request);
        const orders = await orderService.list(userId);
        return reply.send({ success: true, data: orders });
    });
    app.get("/v1/orders/:id", { preHandler: internalAuth }, async (request, reply) => {
        const userId = requireUser(request);
        const { id } = request.params;
        const order = await orderService.getById(id, userId);
        return reply.send({ success: true, data: order });
    });
    app.post("/v1/orders/:id/cancel", { preHandler: internalAuth }, async (request, reply) => {
        const userId = requireUser(request);
        const { id } = request.params;
        const { reason } = cancelOrderSchema.parse(request.body ?? {});
        const order = await orderService.cancel(id, userId, reason);
        return reply.send({ success: true, data: order });
    });
    app.patch("/v1/orders/:id/status", { preHandler: internalAuth }, async (request, reply) => {
        const { id } = request.params;
        const { status } = request.body;
        const order = await orderService.updateStatus(id, status);
        return reply.send({ success: true, data: order });
    });
    app.get("/health", async (_request, reply) => {
        return reply.send({ status: "ok", service: "order-service", timestamp: new Date().toISOString() });
    });
    app.setErrorHandler((error, _request, reply) => {
        if (error instanceof AppError) {
            return reply.status(error.statusCode).send({
                success: false,
                error: { code: error.code, message: error.message },
            });
        }
        if (process.env.NODE_ENV !== "production") {
            console.error("Order service error:", error);
        }
        return reply.status(500).send({
            success: false,
            error: { code: ErrorCodes.INTERNAL_ERROR, message: "Internal error" },
        });
    });
}
