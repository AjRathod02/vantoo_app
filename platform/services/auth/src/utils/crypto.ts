import { randomBytes, createHash } from "node:crypto";
import * as argon2 from "argon2";

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

export function generateOtp(): string {
  const bytes = randomBytes(4);
  const num = bytes.readUInt32BE(0) % 1000000;
  return num.toString().padStart(6, "0");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSecureToken(): string {
  return randomBytes(32).toString("base64url");
}

export function generateSessionToken(): string {
  return randomBytes(48).toString("base64url");
}

export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 900;

  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case "s": return value;
    case "m": return value * 60;
    case "h": return value * 3600;
    case "d": return value * 86400;
    default: return 900;
  }
}

export function isEmail(identifier: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
}

export function isPhone(identifier: string): boolean {
  return /^\+?[1-9]\d{9,14}$/.test(identifier);
}
