import { sendNotificationSchema } from "@vantoo/shared";
import { notificationService } from "../services/notification.service.js";
import { loadEnv } from "../config/env.js";
import { AppError } from "../utils/errors.js";
async function internalAuth(request) {
    if (request.headers["x-internal-key"] !== loadEnv().INTERNAL_SERVICE_KEY) {
        throw AppError.forbidden("Invalid internal service key");
    }
    const userId = request.headers["x-user-id"];
    if (typeof userId === "string")
        request.userId = userId;
}
export async function notificationRoutes(app) {
    app.post("/v1/notifications/send", { preHandler: internalAuth }, async (request, reply) => {
        const input = sendNotificationSchema.parse(request.body);
        const notification = await notificationService.send(input);
        return reply.status(201).send({ success: true, data: notification });
    });
    app.get("/v1/notifications", { preHandler: internalAuth }, async (request, reply) => {
        const userId = request.userId;
        if (!userId)
            return reply.status(403).send({ success: false, error: { message: "User ID required" } });
        const notifications = await notificationService.list(userId);
        return reply.send({ success: true, data: notifications });
    });
    app.patch("/v1/notifications/:id/read", { preHandler: internalAuth }, async (request, reply) => {
        const userId = request.userId;
        if (!userId)
            return reply.status(403).send({ success: false });
        const { id } = request.params;
        await notificationService.markRead(id, userId);
        return reply.send({ success: true });
    });
    app.get("/health", async () => ({ status: "ok", service: "notification-service" }));
}
