export type UserStatus = "active" | "inactive" | "suspended" | "pending_verification" | "banned";
export type OtpChannel = "sms" | "email" | "whatsapp";
export type OtpPurpose = "login" | "register" | "password_reset" | "phone_verify" | "email_verify";
export type IdentityProvider = "email" | "phone" | "google" | "apple";
export type DevicePlatform = "web" | "ios" | "android" | "unknown";
export type SystemRole = "super_admin" | "admin" | "finance_team" | "area_manager" | "support_executive" | "restaurant_owner" | "grocery_store" | "ecommerce_seller" | "vendor" | "delivery_rider" | "customer";
export interface AuthUser {
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    status: UserStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    roles: string[];
    permissions: string[];
    createdAt: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: "Bearer";
}
export interface AuthResponse {
    user: AuthUser;
    tokens: AuthTokens;
    sessionId: string;
    deviceId: string | null;
}
export interface SessionInfo {
    id: string;
    deviceName: string | null;
    platform: DevicePlatform;
    ipAddress: string | null;
    userAgent: string | null;
    isActive: boolean;
    lastActiveAt: string;
    createdAt: string;
    isCurrent: boolean;
}
export interface DeviceInfo {
    id: string;
    deviceName: string;
    platform: DevicePlatform;
    isTrusted: boolean;
    biometricEnabled: boolean;
    lastSeenAt: string;
    createdAt: string;
}
export interface JwtPayload {
    sub: string;
    email: string | null;
    roles: string[];
    permissions: string[];
    sessionId: string;
    deviceId: string | null;
    iat: number;
    exp: number;
    iss: string;
    aud: string;
}
