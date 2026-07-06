import { registerSchema, loginSchema, otpSendSchema, otpVerifySchema, refreshTokenSchema, passwordResetRequestSchema, passwordResetSchema, oauthGoogleSchema, oauthAppleSchema, } from "@vantoo/shared";
import { authService } from "../services/auth.service.js";
import { otpService } from "../services/otp.service.js";
import { oauthService } from "../services/oauth.service.js";
import { sessionService } from "../services/session.service.js";
import { authenticate, getRequestContext } from "../middleware/auth.middleware.js";
export async function authRoutes(app) {
    app.post("/v1/auth/register", async (request, reply) => {
        const input = registerSchema.parse(request.body);
        const ctx = getRequestContext(request);
        const result = await authService.register(input, ctx);
        return reply.status(201).send({ success: true, data: result });
    });
    app.post("/v1/auth/login", async (request, reply) => {
        const input = loginSchema.parse(request.body);
        const ctx = getRequestContext(request);
        const result = await authService.login(input, ctx);
        return reply.send({ success: true, data: result });
    });
    app.post("/v1/auth/otp/send", async (request, reply) => {
        const input = otpSendSchema.parse(request.body);
        const ctx = getRequestContext(request);
        const result = await otpService.sendOtp(input.identifier, input.channel, input.purpose, ctx.ipAddress);
        return reply.send({ success: true, data: result });
    });
    app.post("/v1/auth/otp/verify", async (request, reply) => {
        const input = otpVerifySchema.parse(request.body);
        const ctx = getRequestContext(request);
        const result = await authService.verifyOtpLogin(input, ctx);
        return reply.send({ success: true, data: result });
    });
    app.post("/v1/auth/refresh", async (request, reply) => {
        const input = refreshTokenSchema.parse(request.body);
        const result = await authService.refreshAccessToken(input.refreshToken);
        return reply.send({ success: true, data: result });
    });
    app.post("/v1/auth/logout", { preHandler: authenticate }, async (request, reply) => {
        await authService.logout(request.user.sessionId, request.user.sub);
        return reply.send({ success: true, data: { message: "Logged out successfully" } });
    });
    app.post("/v1/auth/logout-all", { preHandler: authenticate }, async (request, reply) => {
        const count = await authService.logoutAll(request.user.sub, request.user.sessionId);
        return reply.send({ success: true, data: { sessionsRevoked: count } });
    });
    app.get("/v1/auth/me", { preHandler: authenticate }, async (request, reply) => {
        const user = await authService.getMe(request.user.sub);
        return reply.send({ success: true, data: user });
    });
    app.get("/v1/auth/sessions", { preHandler: authenticate }, async (request, reply) => {
        const sessions = await sessionService.listSessions(request.user.sub, request.user.sessionId);
        return reply.send({ success: true, data: sessions });
    });
    app.delete("/v1/auth/sessions/:sessionId", { preHandler: authenticate }, async (request, reply) => {
        const { sessionId } = request.params;
        await sessionService.revokeSession(request.user.sub, sessionId);
        return reply.send({ success: true, data: { message: "Session revoked" } });
    });
    app.get("/v1/auth/devices", { preHandler: authenticate }, async (request, reply) => {
        const devices = await sessionService.listDevices(request.user.sub);
        return reply.send({ success: true, data: devices });
    });
    app.delete("/v1/auth/devices/:deviceId", { preHandler: authenticate }, async (request, reply) => {
        const { deviceId } = request.params;
        await sessionService.removeDevice(request.user.sub, deviceId);
        return reply.send({ success: true, data: { message: "Device removed" } });
    });
    app.post("/v1/auth/password/reset-request", async (request, reply) => {
        const input = passwordResetRequestSchema.parse(request.body);
        const ctx = getRequestContext(request);
        await otpService.sendOtp(input.email, "email", "password_reset", ctx.ipAddress);
        return reply.send({ success: true, data: { message: "OTP sent to email" } });
    });
    app.post("/v1/auth/password/reset", async (request, reply) => {
        const input = passwordResetSchema.parse(request.body);
        await authService.resetPassword(input.email, input.otp, input.newPassword);
        return reply.send({ success: true, data: { message: "Password reset successfully" } });
    });
    app.post("/v1/auth/oauth/google", async (request, reply) => {
        const input = oauthGoogleSchema.parse(request.body);
        const ctx = getRequestContext(request);
        const result = await oauthService.loginWithGoogle(input.idToken, input.device, ctx);
        return reply.send({ success: true, data: result });
    });
    app.post("/v1/auth/oauth/apple", async (request, reply) => {
        const input = oauthAppleSchema.parse(request.body);
        const ctx = getRequestContext(request);
        const result = await oauthService.loginWithApple(input.identityToken, input.firstName, input.lastName, input.device, ctx);
        return reply.send({ success: true, data: result });
    });
    app.get("/health", async (_request, reply) => {
        return reply.send({ status: "ok", service: "auth-service", timestamp: new Date().toISOString() });
    });
}
