import { getPool } from "../db/pool.js";
import { AppError } from "../utils/errors.js";
export class SessionService {
    async listSessions(userId, currentSessionId) {
        const pool = getPool();
        const result = await pool.query(`SELECT s.id, d.device_name, COALESCE(d.platform::TEXT, 'unknown') as platform,
              s.ip_address::TEXT, s.user_agent, s.is_active, s.last_active_at, s.created_at
       FROM auth.user_sessions s
       LEFT JOIN auth.user_devices d ON d.id = s.device_id
       WHERE s.user_id = $1 AND s.is_active = TRUE
       ORDER BY s.last_active_at DESC`, [userId]);
        return result.rows.map((row) => ({
            id: row.id,
            deviceName: row.device_name,
            platform: row.platform,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            isActive: row.is_active,
            lastActiveAt: row.last_active_at.toISOString(),
            createdAt: row.created_at.toISOString(),
            isCurrent: row.id === currentSessionId,
        }));
    }
    async revokeSession(userId, sessionId) {
        const pool = getPool();
        const result = await pool.query(`UPDATE auth.user_sessions SET is_active = FALSE, revoked_at = NOW()
       WHERE id = $1 AND user_id = $2 AND is_active = TRUE
       RETURNING id`, [sessionId, userId]);
        if (result.rowCount === 0) {
            throw AppError.notFound("Session not found");
        }
        await pool.query(`UPDATE auth.refresh_tokens SET is_revoked = TRUE, revoked_at = NOW()
       WHERE session_id = $1 AND is_revoked = FALSE`, [sessionId]);
    }
    async listDevices(userId) {
        const pool = getPool();
        const result = await pool.query(`SELECT id, device_name, platform::TEXT, is_trusted, biometric_enabled, last_seen_at, created_at
       FROM auth.user_devices WHERE user_id = $1 ORDER BY last_seen_at DESC`, [userId]);
        return result.rows.map((row) => ({
            id: row.id,
            deviceName: row.device_name,
            platform: row.platform,
            isTrusted: row.is_trusted,
            biometricEnabled: row.biometric_enabled,
            lastSeenAt: row.last_seen_at.toISOString(),
            createdAt: row.created_at.toISOString(),
        }));
    }
    async removeDevice(userId, deviceId) {
        const pool = getPool();
        const result = await pool.query(`DELETE FROM auth.user_devices WHERE id = $1 AND user_id = $2 RETURNING id`, [deviceId, userId]);
        if (result.rowCount === 0) {
            throw AppError.notFound("Device not found");
        }
    }
    async validateSession(sessionId) {
        const pool = getPool();
        const result = await pool.query(`SELECT id FROM auth.user_sessions
       WHERE id = $1 AND is_active = TRUE AND expires_at > NOW() AND revoked_at IS NULL`, [sessionId]);
        return result.rowCount !== null && result.rowCount > 0;
    }
}
export const sessionService = new SessionService();
