import { z } from "zod";
const deviceInfoSchema = z.object({
    fingerprint: z.string().min(8).max(256),
    deviceName: z.string().max(100).optional(),
    platform: z.enum(["web", "ios", "android", "unknown"]).optional(),
    pushToken: z.string().max(512).optional(),
});
export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    firstName: z.string().min(1).max(50),
    lastName: z.string().max(50).optional(),
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(),
    device: deviceInfoSchema.optional(),
});
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
    device: deviceInfoSchema.optional(),
});
export const otpSendSchema = z.object({
    identifier: z.string().min(5).max(255),
    channel: z.enum(["sms", "email", "whatsapp"]),
    purpose: z.enum(["login", "register", "password_reset", "phone_verify", "email_verify"]),
});
export const otpVerifySchema = z.object({
    identifier: z.string().min(5).max(255),
    otp: z.string().length(6).regex(/^\d{6}$/),
    purpose: z.enum(["login", "register", "password_reset", "phone_verify", "email_verify"]),
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().max(50).optional(),
    device: deviceInfoSchema.optional(),
});
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1),
});
export const passwordResetRequestSchema = z.object({
    email: z.string().email(),
});
export const passwordResetSchema = z.object({
    email: z.string().email(),
    otp: z.string().length(6).regex(/^\d{6}$/),
    newPassword: z.string().min(8).max(128),
});
export const oauthGoogleSchema = z.object({
    idToken: z.string().min(1),
    device: deviceInfoSchema.optional(),
});
export const oauthAppleSchema = z.object({
    identityToken: z.string().min(1),
    authorizationCode: z.string().optional(),
    firstName: z.string().max(50).optional(),
    lastName: z.string().max(50).optional(),
    device: deviceInfoSchema.optional(),
});
