import { createRemoteJWKSet, jwtVerify } from "jose";
import { getPool } from "../db/pool.js";
import { loadEnv } from "../config/env.js";
import { authService } from "./auth.service.js";
import { rbacService, type UserRow } from "./rbac.service.js";
import { auditService } from "./audit.service.js";
import { AppError } from "../utils/errors.js";
import type { AuthResponse } from "@vantoo/shared";

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

interface DeviceInput {
  fingerprint: string;
  deviceName?: string;
  platform?: string;
  pushToken?: string;
}

export class OAuthService {
  async loginWithGoogle(
    idToken: string,
    device?: DeviceInput,
    ctx?: RequestContext
  ): Promise<AuthResponse> {
    const env = loadEnv();
    if (!env.GOOGLE_CLIENT_ID) {
      throw AppError.internal("Google OAuth is not configured");
    }

    const { payload } = await jwtVerify(idToken, googleJwks, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: env.GOOGLE_CLIENT_ID,
    });

    const googleId = payload.sub as string;
    const email = payload.email as string | undefined;
    const firstName = (payload.given_name as string) ?? "User";
    const lastName = (payload.family_name as string) ?? "";

    if (!email) {
      throw AppError.validation("Google account must have an email address");
    }

    return this.resolveOAuthUser("google", googleId, email, firstName, lastName, payload, device, ctx);
  }

  async loginWithApple(
    identityToken: string,
    firstName?: string,
    lastName?: string,
    device?: DeviceInput,
    ctx?: RequestContext
  ): Promise<AuthResponse> {
    const env = loadEnv();
    if (!env.APPLE_CLIENT_ID) {
      throw AppError.internal("Apple Sign-In is not configured");
    }

    const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
    const { payload } = await jwtVerify(identityToken, appleJwks, {
      issuer: "https://appleid.apple.com",
      audience: env.APPLE_CLIENT_ID,
    });

    const appleId = payload.sub as string;
    const email = payload.email as string | undefined;

    if (!email) {
      throw AppError.validation("Apple account must share email on first sign-in");
    }

    return this.resolveOAuthUser(
      "apple",
      appleId,
      email,
      firstName ?? "User",
      lastName ?? "",
      payload,
      device,
      ctx
    );
  }

  private async resolveOAuthUser(
    provider: "google" | "apple",
    providerUserId: string,
    email: string,
    firstName: string,
    lastName: string,
    providerData: unknown,
    device?: DeviceInput,
    ctx?: RequestContext
  ): Promise<AuthResponse> {
    const pool = getPool();

    const identityResult = await pool.query<{ user_id: string }>(
      `SELECT user_id FROM auth.auth_identities WHERE provider = $1 AND provider_user_id = $2`,
      [provider, providerUserId]
    );

    let user: UserRow | null = null;

    if (identityResult.rows.length > 0) {
      const userResult = await pool.query<UserRow>(
        `SELECT * FROM auth.users WHERE id = $1 AND deleted_at IS NULL`,
        [identityResult.rows[0].user_id]
      );
      user = userResult.rows[0] ?? null;
    }

    if (!user) {
      const emailResult = await pool.query<UserRow>(
        `SELECT * FROM auth.users WHERE email = $1 AND deleted_at IS NULL`,
        [email.toLowerCase()]
      );
      user = emailResult.rows[0] ?? null;
    }

    if (!user) {
      const createResult = await pool.query<UserRow>(
        `INSERT INTO auth.users (email, first_name, last_name, status, email_verified)
         VALUES ($1, $2, $3, 'active', TRUE)
         RETURNING *`,
        [email.toLowerCase(), firstName, lastName]
      );
      user = createResult.rows[0];
      await rbacService.assignDefaultCustomerRole(user.id);
    }

    await pool.query(
      `INSERT INTO auth.auth_identities (user_id, provider, provider_user_id, provider_email, provider_data)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (provider, provider_user_id) DO UPDATE SET
         provider_email = EXCLUDED.provider_email,
         provider_data = EXCLUDED.provider_data,
         updated_at = NOW()`,
      [user.id, provider, providerUserId, email, JSON.stringify(providerData)]
    );

    const response = await authService.createAuthenticatedSession(user.id, device, ctx ?? {});

    await auditService.log({
      userId: user.id,
      action: `user.oauth_${provider}`,
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });

    return response;
  }
}

export const oauthService = new OAuthService();
