import { SignJWT, jwtVerify } from "jose";
import { loadEnv } from "../config/env.js";
import { parseDuration } from "../utils/crypto.js";
import { AppError } from "../utils/errors.js";
import { ErrorCodes } from "@vantoo/shared";
function getSecret() {
    return new TextEncoder().encode(loadEnv().JWT_SECRET);
}
export async function signAccessToken(payload) {
    const env = loadEnv();
    const expiresIn = parseDuration(env.JWT_ACCESS_EXPIRY);
    return new SignJWT({
        email: payload.email,
        roles: payload.roles,
        permissions: payload.permissions,
        sessionId: payload.sessionId,
        deviceId: payload.deviceId,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(payload.sub)
        .setIssuedAt()
        .setExpirationTime(`${expiresIn}s`)
        .setIssuer(env.JWT_ISSUER)
        .setAudience(env.JWT_AUDIENCE)
        .sign(getSecret());
}
export async function verifyAccessToken(token) {
    const env = loadEnv();
    try {
        const { payload } = await jwtVerify(token, getSecret(), {
            issuer: env.JWT_ISSUER,
            audience: env.JWT_AUDIENCE,
        });
        return {
            sub: payload.sub,
            email: payload.email ?? null,
            roles: payload.roles ?? [],
            permissions: payload.permissions ?? [],
            sessionId: payload.sessionId,
            deviceId: payload.deviceId ?? null,
            iat: payload.iat,
            exp: payload.exp,
            iss: payload.iss,
            aud: payload.aud,
        };
    }
    catch {
        throw new AppError(ErrorCodes.TOKEN_INVALID, "Invalid or expired access token", 401);
    }
}
export function getRefreshTokenExpiry() {
    const env = loadEnv();
    const seconds = parseDuration(env.JWT_REFRESH_EXPIRY);
    return new Date(Date.now() + seconds * 1000);
}
export function getAccessTokenExpirySeconds() {
    return parseDuration(loadEnv().JWT_ACCESS_EXPIRY);
}
export function getSessionExpiry() {
    return getRefreshTokenExpiry();
}
