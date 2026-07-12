import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/server/auth";
import {
  ADMIN_ACCESS_COOKIE,
  ADMIN_REFRESH_COOKIE,
  INACTIVITY_TIMEOUT_MS,
  signAccessToken,
  verifyAccessToken,
  getRefreshTokenExpiry,
} from "./jwt";
import {
  findAdminById,
  findAdminByEmail,
  findSessionByRefreshHash,
  createAdminSession,
  touchSession,
  recordLoginHistory,
  updateAdminLoginSuccess,
  incrementFailedLogins,
  getAdminPermissions,
  revokeSession,
} from "./db";
import { hashPassword, verifyPassword, hashToken, generateToken, parseUserAgent } from "./crypto";
import { loadPermissions } from "./rbac";
import type { AdminUser, AdminPermission } from "./types";

export interface AdminAuthContext {
  admin: AdminUser;
  sessionId: string;
  permissions: AdminPermission[];
}

export class AdminUnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AdminUnauthorizedError";
  }
}

/** Map auth failures to 401; keep unexpected errors as 500. */
export function adminErrorResponse(error: unknown) {
  if (
    error instanceof AdminUnauthorizedError ||
    (error instanceof Error && error.message === "Unauthorized")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: "Failed" }, { status: 500 });
}

export async function getAdminFromCookies(): Promise<AdminAuthContext | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ADMIN_ACCESS_COOKIE)?.value;

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      const admin = await findAdminById(payload.sub);
      if (admin && admin.status === "active") {
        const permissions = await loadPermissions(admin.role);
        return { admin, sessionId: payload.sessionId, permissions };
      }
    }
  }

  const refreshToken = cookieStore.get(ADMIN_REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  const session = await findSessionByRefreshHash(hashToken(refreshToken));
  if (!session) return null;

  const lastActive = new Date(session.last_active_at);
  if (Date.now() - lastActive.getTime() > INACTIVITY_TIMEOUT_MS) {
    await revokeSession(session.id);
    return null;
  }

  const admin = await findAdminById(session.admin_id);
  if (!admin || admin.status !== "active") return null;

  await touchSession(session.id);
  const permissions = await loadPermissions(admin.role);
  return { admin, sessionId: session.id, permissions };
}

export async function requireAdminAuth(): Promise<AdminAuthContext> {
  const ctx = await getAdminFromCookies();
  if (ctx) return ctx;

  // Legacy fallback: Supabase profile admin role
  const legacyUser = await getSessionUser();
  if (legacyUser?.role === "admin") {
    return {
      admin: {
        id: legacyUser.id,
        email: legacyUser.email ?? "",
        name: legacyUser.name,
        phone: legacyUser.phone,
        role: "super_admin",
        status: "active",
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
      },
      sessionId: "legacy",
      permissions: await getAdminPermissions("super_admin"),
    };
  }

  throw new AdminUnauthorizedError();
}

export async function loginAdmin(
  email: string,
  password: string,
  totpCode?: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  admin: AdminUser;
  legacy?: boolean;
}> {
  let admin: Awaited<ReturnType<typeof findAdminByEmail>> = null;
  try {
    admin = await findAdminByEmail(email);
  } catch {
    // admin_users table may not exist yet — fall through to Supabase profile login
  }

  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? "";
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headersList.get("x-real-ip") ?? undefined;
  const { browser, platform, device } = parseUserAgent(userAgent);

  if (!admin) {
    const legacy = await loginViaSupabaseAdminProfile(email, password);
    if (legacy) {
      return { accessToken: "", refreshToken: "", admin: legacy, legacy: true };
    }
    throw new Error("Invalid email or password");
  }

  if (admin.status !== "active") {
    await recordLoginHistory({
      adminId: admin.id,
      ipAddress: ip,
      deviceName: device,
      browser,
      platform,
      userAgent,
      success: false,
      failureReason: `Account ${admin.status}`,
    });
    throw new Error("Account is not active");
  }

  if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
    throw new Error("Account temporarily locked. Try again later.");
  }

  const valid = await verifyPassword(admin.passwordHash, password);
  if (!valid) {
    await incrementFailedLogins(admin.id, admin.failedLoginAttempts + 1);
    await recordLoginHistory({
      adminId: admin.id,
      ipAddress: ip,
      deviceName: device,
      browser,
      platform,
      userAgent,
      success: false,
      failureReason: "Invalid password",
    });
    throw new Error("Invalid email or password");
  }

  if (admin.twoFactorEnabled && admin.twoFactorSecret) {
    if (!totpCode) throw new Error("2FA code required");
    const { TOTP } = await import("otpauth");
    const totp = new TOTP({ secret: admin.twoFactorSecret, digits: 6, period: 30 });
    const delta = totp.validate({ token: totpCode, window: 1 });
    if (delta === null) throw new Error("Invalid 2FA code");
  }

  const refreshToken = generateToken(48);
  const refreshHash = hashToken(refreshToken);
  const expiresAt = getRefreshTokenExpiry();

  const sessionId = await createAdminSession({
    adminId: admin.id,
    refreshTokenHash: refreshHash,
    deviceName: device,
    browser,
    platform,
    ipAddress: ip,
    userAgent,
    expiresAt,
  });

  await updateAdminLoginSuccess(admin.id, ip);
  await recordLoginHistory({
    adminId: admin.id,
    sessionId,
    ipAddress: ip,
    deviceName: device,
    browser,
    platform,
    userAgent,
    success: true,
  });

  const accessToken = await signAccessToken({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    sessionId,
  });

  const { passwordHash: _, twoFactorSecret: __, failedLoginAttempts: ___, lockedUntil: ____, ...safeAdmin } = admin;
  return { accessToken, refreshToken, admin: safeAdmin, legacy: false };
}

async function loginViaSupabaseAdminProfile(
  email: string,
  password: string
): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, phone, email, role, created_at")
      .eq("id", data.user.id)
      .maybeSingle<{
        name: string | null;
        phone: string | null;
        email: string | null;
        role: string | null;
        created_at: string;
      }>();

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      return null;
    }

    return {
      id: data.user.id,
      email: profile.email || data.user.email || email,
      name: profile.name || "Admin",
      phone: profile.phone ?? undefined,
      role: "super_admin",
      status: "active",
      twoFactorEnabled: false,
      createdAt: profile.created_at || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export { hashPassword };
