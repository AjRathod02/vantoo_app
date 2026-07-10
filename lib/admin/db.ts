import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import type { AdminRole, AdminStatus, AdminUser, AdminPermission } from "./types";

type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: AdminRole;
  status: AdminStatus;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  password_hash: string;
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
};

function rowToAdmin(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone ?? undefined,
    role: row.role,
    status: row.status,
    twoFactorEnabled: row.two_factor_enabled,
    lastLoginAt: row.last_login_at ?? undefined,
    createdAt: row.created_at,
  };
}

function getClient() {
  if (!hasAdminClient()) throw new Error("Admin database not configured");
  return createAdminClient();
}

export async function findAdminByEmail(email: string): Promise<(AdminUser & { passwordHash: string; twoFactorSecret?: string; failedLoginAttempts: number; lockedUntil?: string }) | null> {
  const { data, error } = await getClient()
    .from("admin_users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle<AdminUserRow>();

  if (error || !data) return null;
  return {
    ...rowToAdmin(data),
    passwordHash: data.password_hash,
    twoFactorSecret: data.two_factor_secret ?? undefined,
    failedLoginAttempts: data.failed_login_attempts,
    lockedUntil: data.locked_until ?? undefined,
  };
}

export async function findAdminById(id: string): Promise<AdminUser | null> {
  const { data, error } = await getClient()
    .from("admin_users")
    .select("id, email, name, phone, role, status, two_factor_enabled, last_login_at, created_at")
    .eq("id", id)
    .maybeSingle<Omit<AdminUserRow, "password_hash">>();

  if (error || !data) return null;
  return rowToAdmin(data as AdminUserRow);
}

export async function createAdminSession(input: {
  adminId: string;
  refreshTokenHash: string;
  deviceName: string;
  browser: string;
  platform: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}): Promise<string> {
  const { data, error } = await getClient()
    .from("admin_sessions")
    .insert({
      admin_id: input.adminId,
      refresh_token_hash: input.refreshTokenHash,
      device_name: input.deviceName,
      browser: input.browser,
      platform: input.platform,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      expires_at: input.expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) throw new Error("Failed to create session");
  return data.id as string;
}

export async function findSessionByRefreshHash(hash: string) {
  const { data, error } = await getClient()
    .from("admin_sessions")
    .select("id, admin_id, is_active, expires_at, last_active_at")
    .eq("refresh_token_hash", hash)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  if (new Date(data.expires_at as string) < new Date()) return null;
  return data as { id: string; admin_id: string; last_active_at: string };
}

export async function touchSession(sessionId: string) {
  await getClient()
    .from("admin_sessions")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function revokeSession(sessionId: string) {
  await getClient()
    .from("admin_sessions")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function revokeAllSessions(adminId: string) {
  await getClient()
    .from("admin_sessions")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("admin_id", adminId)
    .eq("is_active", true);
}

export async function recordLoginHistory(input: {
  adminId: string;
  sessionId?: string;
  ipAddress?: string;
  deviceName: string;
  browser: string;
  platform: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
}) {
  await getClient().from("admin_login_history").insert({
    admin_id: input.adminId,
    session_id: input.sessionId ?? null,
    ip_address: input.ipAddress ?? null,
    device_name: input.deviceName,
    browser: input.browser,
    platform: input.platform,
    user_agent: input.userAgent ?? null,
    success: input.success,
    failure_reason: input.failureReason ?? null,
  });
}

export async function recordLogout(sessionId: string) {
  await getClient()
    .from("admin_login_history")
    .update({ logout_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .is("logout_at", null);
}

export async function updateAdminLoginSuccess(adminId: string, ip?: string) {
  await getClient()
    .from("admin_users")
    .update({
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
      last_login_ip: ip ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", adminId);
}

export async function incrementFailedLogins(adminId: string, attempts: number) {
  const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
  await getClient()
    .from("admin_users")
    .update({
      failed_login_attempts: attempts,
      locked_until: lockedUntil,
      updated_at: new Date().toISOString(),
    })
    .eq("id", adminId);
}

export async function getAdminPermissions(role: AdminRole): Promise<AdminPermission[]> {
  const client = getClient();
  const { data: perms } = await client
    .from("admin_role_permissions")
    .select("permission_id")
    .eq("role", role);

  if (!perms?.length) return [];

  const ids = perms.map((p) => p.permission_id);
  const { data } = await client
    .from("admin_permissions")
    .select("resource, action")
    .in("id", ids);

  return (data ?? []) as AdminPermission[];
}

export async function storeOtp(adminId: string, tokenHash: string, purpose: string, expiresAt: Date) {
  await getClient().from("admin_otp_tokens").insert({
    admin_id: adminId,
    token_hash: tokenHash,
    purpose,
    expires_at: expiresAt.toISOString(),
  });
}

export async function verifyOtp(adminId: string, tokenHash: string, purpose: string): Promise<boolean> {
  const { data } = await getClient()
    .from("admin_otp_tokens")
    .select("id, expires_at")
    .eq("admin_id", adminId)
    .eq("token_hash", tokenHash)
    .eq("purpose", purpose)
    .is("used_at", null)
    .maybeSingle();

  if (!data || new Date(data.expires_at as string) < new Date()) return false;

  await getClient()
    .from("admin_otp_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);

  return true;
}

export async function updateAdminPassword(adminId: string, passwordHash: string) {
  await getClient()
    .from("admin_users")
    .update({
      password_hash: passwordHash,
      password_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", adminId);
}

export async function createAdminUser(input: {
  email: string;
  passwordHash: string;
  name: string;
  role: AdminRole;
  createdBy?: string;
}) {
  const { data, error } = await getClient()
    .from("admin_users")
    .insert({
      email: input.email.toLowerCase().trim(),
      password_hash: input.passwordHash,
      name: input.name,
      role: input.role,
      created_by: input.createdBy ?? null,
    })
    .select("id, email, name, role, status, two_factor_enabled, created_at")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create admin");
  return rowToAdmin(data as AdminUserRow);
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const { data } = await getClient()
    .from("admin_users")
    .select("id, email, name, phone, role, status, two_factor_enabled, last_login_at, created_at")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => rowToAdmin(row as AdminUserRow));
}
