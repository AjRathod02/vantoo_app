import { SignJWT, jwtVerify } from "jose";
import type { AdminJwtPayload, AdminRole } from "./types";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_DAYS = 7;

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_JWT_SECRET or JWT_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(payload: {
  adminId: string;
  email: string;
  role: AdminRole;
  sessionId: string;
}): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
    type: "admin_access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.adminId)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getSecret());
}

export async function verifyAccessToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.type !== "admin_access") return null;
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as AdminRole,
      sessionId: payload.sessionId as string,
      type: "admin_access",
    };
  } catch {
    return null;
  }
}

export function getRefreshTokenExpiry(): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + REFRESH_TOKEN_DAYS);
  return expires;
}

export const ADMIN_ACCESS_COOKIE = "vantoo_admin_access";
export const ADMIN_REFRESH_COOKIE = "vantoo_admin_refresh";
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
