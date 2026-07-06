import { randomBytes, createHash } from "node:crypto";
import * as argon2 from "argon2";
export async function hashPassword(password) {
    return argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
    });
}
export async function verifyPassword(hash, password) {
    try {
        return await argon2.verify(hash, password);
    }
    catch {
        return false;
    }
}
export function generateOtp() {
    const bytes = randomBytes(4);
    const num = bytes.readUInt32BE(0) % 1000000;
    return num.toString().padStart(6, "0");
}
export function hashToken(token) {
    return createHash("sha256").update(token).digest("hex");
}
export function generateSecureToken() {
    return randomBytes(32).toString("base64url");
}
export function generateSessionToken() {
    return randomBytes(48).toString("base64url");
}
export function parseDuration(duration) {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match)
        return 900;
    const value = parseInt(match[1], 10);
    switch (match[2]) {
        case "s": return value;
        case "m": return value * 60;
        case "h": return value * 3600;
        case "d": return value * 86400;
        default: return 900;
    }
}
export function isEmail(identifier) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
}
export function isPhone(identifier) {
    return /^\+?[1-9]\d{9,14}$/.test(identifier);
}
