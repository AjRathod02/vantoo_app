import { getPool } from "../db/pool.js";
import { DEFAULT_CUSTOMER_ROLE } from "@vantoo/shared";
import type { UserStatus } from "@vantoo/shared";

interface UserRow {
  id: string;
  email: string | null;
  phone: string | null;
  password_hash: string | null;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  status: string;
  email_verified: boolean;
  phone_verified: boolean;
  failed_login_attempts: number;
  locked_until: Date | null;
  created_at: Date;
}

export class RbacService {
  async getUserRoles(userId: string): Promise<string[]> {
    const pool = getPool();
    const result = await pool.query<{ name: string }>(
      `SELECT r.name FROM auth.user_roles ur
       JOIN auth.roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`,
      [userId]
    );
    return result.rows.map((r) => r.name);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const pool = getPool();
    const result = await pool.query<{ name: string }>(
      `SELECT DISTINCT p.name FROM auth.user_roles ur
       JOIN auth.role_permissions rp ON rp.role_id = ur.role_id
       JOIN auth.permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = $1 AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`,
      [userId]
    );
    return result.rows.map((p) => p.name);
  }

  async assignRole(userId: string, roleName: string, assignedBy?: string): Promise<void> {
    const pool = getPool();
    await pool.query(
      `INSERT INTO auth.user_roles (user_id, role_id, assigned_by)
       SELECT $1, r.id, $2 FROM auth.roles r WHERE r.name = $3
       ON CONFLICT (user_id, role_id) DO NOTHING`,
      [userId, assignedBy ?? null, roleName]
    );
  }

  async assignDefaultCustomerRole(userId: string): Promise<void> {
    await this.assignRole(userId, DEFAULT_CUSTOMER_ROLE);
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const roles = await this.getUserRoles(userId);
    if (roles.includes("super_admin")) return true;

    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  mapUserRow(row: UserRow, roles: string[], permissions: string[]) {
    return {
      id: row.id,
      email: row.email,
      phone: row.phone,
      firstName: row.first_name,
      lastName: row.last_name,
      avatarUrl: row.avatar_url,
      status: row.status as UserStatus,
      emailVerified: row.email_verified,
      phoneVerified: row.phone_verified,
      roles,
      permissions,
      createdAt: row.created_at.toISOString(),
    };
  }
}

export const rbacService = new RbacService();
export type { UserRow };
