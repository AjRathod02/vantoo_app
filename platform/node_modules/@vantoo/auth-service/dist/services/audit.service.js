import { getPool } from "../db/pool.js";
export class AuditService {
    async log(params) {
        const pool = getPool();
        await pool.query(`INSERT INTO auth.audit_logs (user_id, action, resource, resource_id, ip_address, user_agent, metadata, success)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            params.userId ?? null,
            params.action,
            params.resource ?? null,
            params.resourceId ?? null,
            params.ipAddress ?? null,
            params.userAgent ?? null,
            JSON.stringify(params.metadata ?? {}),
            params.success ?? true,
        ]);
    }
}
export const auditService = new AuditService();
