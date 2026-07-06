import { z } from "zod";
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    device: z.ZodOptional<z.ZodObject<{
        fingerprint: z.ZodString;
        deviceName: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodEnum<["web", "ios", "android", "unknown"]>>;
        pushToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    }, {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    phone?: string | undefined;
    lastName?: string | undefined;
    device?: {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    } | undefined;
}, {
    email: string;
    password: string;
    firstName: string;
    phone?: string | undefined;
    lastName?: string | undefined;
    device?: {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    } | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    device: z.ZodOptional<z.ZodObject<{
        fingerprint: z.ZodString;
        deviceName: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodEnum<["web", "ios", "android", "unknown"]>>;
        pushToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    }, {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    device?: {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    } | undefined;
}, {
    email: string;
    password: string;
    device?: {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    } | undefined;
}>;
export declare const otpSendSchema: z.ZodObject<{
    identifier: z.ZodString;
    channel: z.ZodEnum<["sms", "email", "whatsapp"]>;
    purpose: z.ZodEnum<["login", "register", "password_reset", "phone_verify", "email_verify"]>;
}, "strip", z.ZodTypeAny, {
    identifier: string;
    channel: "sms" | "email" | "whatsapp";
    purpose: "login" | "register" | "password_reset" | "phone_verify" | "email_verify";
}, {
    identifier: string;
    channel: "sms" | "email" | "whatsapp";
    purpose: "login" | "register" | "password_reset" | "phone_verify" | "email_verify";
}>;
export declare const otpVerifySchema: z.ZodObject<{
    identifier: z.ZodString;
    otp: z.ZodString;
    purpose: z.ZodEnum<["login", "register", "password_reset", "phone_verify", "email_verify"]>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    device: z.ZodOptional<z.ZodObject<{
        fingerprint: z.ZodString;
        deviceName: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodEnum<["web", "ios", "android", "unknown"]>>;
        pushToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    }, {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    identifier: string;
    purpose: "login" | "register" | "password_reset" | "phone_verify" | "email_verify";
    otp: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    device?: {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    } | undefined;
}, {
    identifier: string;
    purpose: "login" | "register" | "password_reset" | "phone_verify" | "email_verify";
    otp: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    device?: {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    } | undefined;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const passwordResetRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const passwordResetSchema: z.ZodObject<{
    email: z.ZodString;
    otp: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    otp: string;
    newPassword: string;
}, {
    email: string;
    otp: string;
    newPassword: string;
}>;
export declare const oauthGoogleSchema: z.ZodObject<{
    idToken: z.ZodString;
    device: z.ZodOptional<z.ZodObject<{
        fingerprint: z.ZodString;
        deviceName: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodEnum<["web", "ios", "android", "unknown"]>>;
        pushToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    }, {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    idToken: string;
    device?: {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    } | undefined;
}, {
    idToken: string;
    device?: {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    } | undefined;
}>;
export declare const oauthAppleSchema: z.ZodObject<{
    identityToken: z.ZodString;
    authorizationCode: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    device: z.ZodOptional<z.ZodObject<{
        fingerprint: z.ZodString;
        deviceName: z.ZodOptional<z.ZodString>;
        platform: z.ZodOptional<z.ZodEnum<["web", "ios", "android", "unknown"]>>;
        pushToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    }, {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    identityToken: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    device?: {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    } | undefined;
    authorizationCode?: string | undefined;
}, {
    identityToken: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    device?: {
        fingerprint: string;
        deviceName?: string | undefined;
        platform?: "web" | "ios" | "android" | "unknown" | undefined;
        pushToken?: string | undefined;
    } | undefined;
    authorizationCode?: string | undefined;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpSendInput = z.infer<typeof otpSendSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type OAuthGoogleInput = z.infer<typeof oauthGoogleSchema>;
export type OAuthAppleInput = z.infer<typeof oauthAppleSchema>;
