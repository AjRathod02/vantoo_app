import { SignJWT, jwtVerify } from "jose";
import { loadEnv } from "../config/env.js";
import type { JwtPayload } from "@vantoo/shared";
import { parseDuration } from "../utils/crypto.js";
import { AppError } from "../utils/errors.js";
import { ErrorCodes } from "@vantoo/shared";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(loadEnv().JWT_SECRET);
}

export async function signAccessToken(payload: Omit<JwtPayload, "iat" | "exp" | "iss" | "aud">): Promise<string> {
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

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const env = loadEnv();
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    return {
      sub: payload.sub as string,
      email: (payload.email as string) ?? null,
      roles: (payload.roles as string[]) ?? [],
      permissions: (payload.permissions as string[]) ?? [],
      sessionId: payload.sessionId as string,
      deviceId: (payload.deviceId as string) ?? null,
      iat: payload.iat as number,
      exp: payload.exp as number,
      iss: payload.iss as string,
      aud: payload.aud as string,
    };
  } catch {
    throw new AppError(ErrorCodes.TOKEN_INVALID, "Invalid or expired access token", 401);
  }
}

export function getRefreshTokenExpiry(): Date {
  const env = loadEnv();
  const seconds = parseDuration(env.JWT_REFRESH_EXPIRY);
  return new Date(Date.now() + seconds * 1000);
}

export function getAccessTokenExpirySeconds(): number {
  return parseDuration(loadEnv().JWT_ACCESS_EXPIRY);
}

export function getSessionExpiry(): Date {
  return getRefreshTokenExpiry();
}
