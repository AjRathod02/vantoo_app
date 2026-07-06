import { getPool } from "../db/pool.js";
import { DEFAULT_CUSTOMER_ROLE } from "@vantoo/shared";
export class RbacService {
    async getUserRoles(userId) {
        const pool = getPool();
        const result = await pool.query(`SELECT r.name FROM auth.user_roles ur
       JOIN auth.roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1 AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`, [userId]);
        return result.rows.map((r) => r.name);
    }
    async getUserPermissions(userId) {
        const pool = getPool();
        const result = await pool.query(`SELECT DISTINCT p.name FROM auth.user_roles ur
       JOIN auth.role_permissions rp ON rp.role_id = ur.role_id
       JOIN auth.permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = $1 AND (ur.expires_at IS NULL OR ur.expires_at > NOW())`, [userId]);
        return result.rows.map((p) => p.name);
    }
    async assignRole(userId, roleName, assignedBy) {
        const pool = getPool();
        await pool.query(`INSERT INTO auth.user_roles (user_id, role_id, assigned_by)
       SELECT $1, r.id, $2 FROM auth.roles r WHERE r.name = $3
       ON CONFLICT (user_id, role_id) DO NOTHING`, [userId, assignedBy ?? null, roleName]);
    }
    async assignDefaultCustomerRole(userId) {
        await this.assignRole(userId, DEFAULT_CUSTOMER_ROLE);
    }
    async hasPermission(userId, permission) {
        const roles = await this.getUserRoles(userId);
        if (roles.includes("super_admin"))
            return true;
        const permissions = await this.getUserPermissions(userId);
        return permissions.includes(permission);
    }
    mapUserRow(row, roles, permissions) {
        return {
            id: row.id,
            email: row.email,
            phone: row.phone,
            firstName: row.first_name,
            lastName: row.last_name,
            avatarUrl: row.avatar_url,
            status: row.status,
            emailVerified: row.email_verified,
            phoneVerified: row.phone_verified,
            roles,
            permissions,
            createdAt: row.created_at.toISOString(),
        };
    }
}
export const rbacService = new RbacService();
