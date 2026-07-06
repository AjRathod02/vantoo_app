import { getPool } from "../db/pool.js";
import { loadEnv } from "../config/env.js";
import { generateSecureToken, generateSessionToken, hashPassword, hashToken, verifyPassword, isEmail, isPhone, } from "../utils/crypto.js";
import { signAccessToken, getRefreshTokenExpiry, getAccessTokenExpirySeconds, getSessionExpiry, } from "./token.service.js";
import { otpService } from "./otp.service.js";
import { auditService } from "./audit.service.js";
import { rbacService } from "./rbac.service.js";
import { AppError } from "../utils/errors.js";
import { ErrorCodes } from "@vantoo/shared";
export class AuthService {
    async findUserByEmail(email) {
        const pool = getPool();
        const result = await pool.query(`SELECT * FROM auth.users WHERE email = $1 AND deleted_at IS NULL`, [email.toLowerCase()]);
        return result.rows[0] ?? null;
    }
    async findUserByPhone(phone) {
        const pool = getPool();
        const result = await pool.query(`SELECT * FROM auth.users WHERE phone = $1 AND deleted_at IS NULL`, [phone]);
        return result.rows[0] ?? null;
    }
    async findUserById(id) {
        const pool = getPool();
        const result = await pool.query(`SELECT * FROM auth.users WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return result.rows[0] ?? null;
    }
    checkAccountLock(user) {
        if (user.status === "suspended" || user.status === "banned") {
            throw new AppError(ErrorCodes.ACCOUNT_SUSPENDED, "Account is suspended", 403);
        }
        if (user.locked_until && new Date() < user.locked_until) {
            throw new AppError(ErrorCodes.ACCOUNT_LOCKED, "Account is temporarily locked", 423);
        }
    }
    async registerDevice(userId, device) {
        if (!device?.fingerprint)
            return null;
        const pool = getPool();
        const result = await pool.query(`INSERT INTO auth.user_devices (user_id, fingerprint, device_name, platform, push_token)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, fingerprint) DO UPDATE SET
         device_name = EXCLUDED.device_name,
         platform = EXCLUDED.platform,
         push_token = COALESCE(EXCLUDED.push_token, auth.user_devices.push_token),
         last_seen_at = NOW(),
         updated_at = NOW()
       RETURNING id`, [
            userId,
            device.fingerprint,
            device.deviceName ?? "Unknown Device",
            device.platform ?? "unknown",
            device.pushToken ?? null,
        ]);
        return result.rows[0].id;
    }
    async enforceSessionLimit(userId) {
        const env = loadEnv();
        const pool = getPool();
        await pool.query(`WITH excess AS (
         SELECT id FROM auth.user_sessions
         WHERE user_id = $1 AND is_active = TRUE
         ORDER BY last_active_at ASC
         OFFSET $2
       )
       UPDATE auth.user_sessions SET is_active = FALSE, revoked_at = NOW()
       WHERE id IN (SELECT id FROM excess)`, [userId, env.MAX_SESSIONS_PER_USER - 1]);
    }
    async createSession(userId, deviceId, ctx) {
        const pool = getPool();
        const sessionToken = generateSessionToken();
        const refreshToken = generateSecureToken();
        const refreshTokenHash = hashToken(refreshToken);
        const expiresAt = getSessionExpiry();
        await this.enforceSessionLimit(userId);
        const sessionResult = await pool.query(`INSERT INTO auth.user_sessions (user_id, device_id, session_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`, [userId, deviceId, sessionToken, ctx.ipAddress ?? null, ctx.userAgent ?? null, expiresAt]);
        const sessionId = sessionResult.rows[0].id;
        await pool.query(`INSERT INTO auth.refresh_tokens (user_id, session_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`, [userId, sessionId, refreshTokenHash, getRefreshTokenExpiry()]);
        await pool.query(`UPDATE auth.users SET last_login_at = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = $1`, [userId]);
        return { sessionId, refreshToken };
    }
    async buildAuthResponse(user, sessionId, refreshToken, deviceId) {
        const roles = await rbacService.getUserRoles(user.id);
        const permissions = await rbacService.getUserPermissions(user.id);
        const accessToken = await signAccessToken({
            sub: user.id,
            email: user.email,
            roles,
            permissions,
            sessionId,
            deviceId,
        });
        return {
            user: rbacService.mapUserRow(user, roles, permissions),
            tokens: {
                accessToken,
                refreshToken,
                expiresIn: getAccessTokenExpirySeconds(),
                tokenType: "Bearer",
            },
            sessionId,
            deviceId,
        };
    }
    async register(input, ctx) {
        const existing = await this.findUserByEmail(input.email);
        if (existing) {
            throw AppError.conflict("An account with this email already exists");
        }
        if (input.phone) {
            const existingPhone = await this.findUserByPhone(input.phone);
            if (existingPhone) {
                throw AppError.conflict("An account with this phone number already exists");
            }
        }
        const passwordHash = await hashPassword(input.password);
        const pool = getPool();
        const result = await pool.query(`INSERT INTO auth.users (email, phone, password_hash, first_name, last_name, status)
       VALUES ($1, $2, $3, $4, $5, 'pending_verification')
       RETURNING *`, [
            input.email.toLowerCase(),
            input.phone ?? null,
            passwordHash,
            input.firstName,
            input.lastName ?? "",
        ]);
        const user = result.rows[0];
        await rbacService.assignDefaultCustomerRole(user.id);
        const deviceId = await this.registerDevice(user.id, input.device);
        const { sessionId, refreshToken } = await this.createSession(user.id, deviceId, ctx);
        await auditService.log({
            userId: user.id,
            action: "user.registered",
            resource: "user",
            resourceId: user.id,
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
        });
        return this.buildAuthResponse(user, sessionId, refreshToken, deviceId);
    }
    async login(input, ctx) {
        const user = await this.findUserByEmail(input.email);
        if (!user || !user.password_hash) {
            throw new AppError(ErrorCodes.INVALID_CREDENTIALS, "Invalid email or password", 401);
        }
        this.checkAccountLock(user);
        const valid = await verifyPassword(user.password_hash, input.password);
        if (!valid) {
            const env = loadEnv();
            const pool = getPool();
            const attempts = user.failed_login_attempts + 1;
            if (attempts >= env.ACCOUNT_LOCKOUT_ATTEMPTS) {
                await pool.query(`UPDATE auth.users SET failed_login_attempts = $1, locked_until = NOW() + ($2 || ' minutes')::INTERVAL WHERE id = $3`, [attempts, env.ACCOUNT_LOCKOUT_MINUTES, user.id]);
                throw new AppError(ErrorCodes.ACCOUNT_LOCKED, "Account locked due to too many failed attempts", 423);
            }
            await pool.query(`UPDATE auth.users SET failed_login_attempts = $1 WHERE id = $2`, [attempts, user.id]);
            await auditService.log({
                userId: user.id,
                action: "user.login_failed",
                ipAddress: ctx.ipAddress,
                userAgent: ctx.userAgent,
                success: false,
            });
            throw new AppError(ErrorCodes.INVALID_CREDENTIALS, "Invalid email or password", 401);
        }
        const deviceId = await this.registerDevice(user.id, input.device);
        const { sessionId, refreshToken } = await this.createSession(user.id, deviceId, ctx);
        await auditService.log({
            userId: user.id,
            action: "user.logged_in",
            resource: "session",
            resourceId: sessionId,
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
        });
        return this.buildAuthResponse(user, sessionId, refreshToken, deviceId);
    }
    async verifyOtpLogin(input, ctx) {
        await otpService.verifyOtp(input.identifier, input.otp, input.purpose);
        const pool = getPool();
        let user = null;
        if (isEmail(input.identifier)) {
            user = await this.findUserByEmail(input.identifier);
        }
        else if (isPhone(input.identifier)) {
            user = await this.findUserByPhone(input.identifier);
        }
        if (!user && input.purpose === "login") {
            throw AppError.notFound("No account found. Please register first.");
        }
        if (!user && (input.purpose === "register" || input.purpose === "phone_verify")) {
            const email = isEmail(input.identifier) ? input.identifier.toLowerCase() : null;
            const phone = isPhone(input.identifier) ? input.identifier : null;
            const result = await pool.query(`INSERT INTO auth.users (email, phone, first_name, last_name, status, email_verified, phone_verified)
         VALUES ($1, $2, $3, $4, 'active', $5, $6)
         RETURNING *`, [
                email,
                phone,
                input.firstName ?? "User",
                input.lastName ?? "",
                email !== null,
                phone !== null,
            ]);
            user = result.rows[0];
            await rbacService.assignDefaultCustomerRole(user.id);
        }
        if (!user) {
            throw AppError.internal("Failed to resolve user after OTP verification");
        }
        this.checkAccountLock(user);
        if (isEmail(input.identifier)) {
            await pool.query(`UPDATE auth.users SET email_verified = TRUE, status = 'active' WHERE id = $1`, [user.id]);
        }
        if (isPhone(input.identifier)) {
            await pool.query(`UPDATE auth.users SET phone_verified = TRUE, status = 'active' WHERE id = $1`, [user.id]);
        }
        const refreshed = await this.findUserById(user.id);
        if (!refreshed)
            throw AppError.internal("User not found after update");
        const deviceId = await this.registerDevice(refreshed.id, input.device);
        const { sessionId, refreshToken } = await this.createSession(refreshed.id, deviceId, ctx);
        await auditService.log({
            userId: refreshed.id,
            action: "user.otp_login",
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
            metadata: { purpose: input.purpose },
        });
        return this.buildAuthResponse(refreshed, sessionId, refreshToken, deviceId);
    }
    async refreshAccessToken(refreshToken) {
        const pool = getPool();
        const tokenHash = hashToken(refreshToken);
        const result = await pool.query(`SELECT rt.id, rt.user_id, rt.session_id, rt.expires_at, rt.is_revoked, s.is_active
       FROM auth.refresh_tokens rt
       JOIN auth.user_sessions s ON s.id = rt.session_id
       WHERE rt.token_hash = $1`, [tokenHash]);
        if (result.rows.length === 0) {
            throw new AppError(ErrorCodes.TOKEN_INVALID, "Invalid refresh token", 401);
        }
        const record = result.rows[0];
        if (record.is_revoked || !record.is_active || new Date() > record.expires_at) {
            throw new AppError(ErrorCodes.SESSION_REVOKED, "Session has been revoked or expired", 401);
        }
        const user = await this.findUserById(record.user_id);
        if (!user) {
            throw new AppError(ErrorCodes.UNAUTHORIZED, "User not found", 401);
        }
        this.checkAccountLock(user);
        await pool.query(`UPDATE auth.user_sessions SET last_active_at = NOW() WHERE id = $1`, [record.session_id]);
        const sessionResult = await pool.query(`SELECT device_id FROM auth.user_sessions WHERE id = $1`, [record.session_id]);
        const deviceId = sessionResult.rows[0]?.device_id ?? null;
        const newRefreshToken = generateSecureToken();
        await pool.query(`UPDATE auth.refresh_tokens SET is_revoked = TRUE, revoked_at = NOW() WHERE id = $1`, [record.id]);
        await pool.query(`INSERT INTO auth.refresh_tokens (user_id, session_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`, [record.user_id, record.session_id, hashToken(newRefreshToken), getRefreshTokenExpiry()]);
        return this.buildAuthResponse(user, record.session_id, newRefreshToken, deviceId);
    }
    async logout(sessionId, userId) {
        const pool = getPool();
        await pool.query(`UPDATE auth.user_sessions SET is_active = FALSE, revoked_at = NOW() WHERE id = $1 AND user_id = $2`, [sessionId, userId]);
        await pool.query(`UPDATE auth.refresh_tokens SET is_revoked = TRUE, revoked_at = NOW()
       WHERE session_id = $1 AND is_revoked = FALSE`, [sessionId]);
        await auditService.log({
            userId,
            action: "user.logged_out",
            resource: "session",
            resourceId: sessionId,
        });
    }
    async logoutAll(userId, exceptSessionId) {
        const pool = getPool();
        const result = await pool.query(`UPDATE auth.user_sessions SET is_active = FALSE, revoked_at = NOW()
       WHERE user_id = $1 AND is_active = TRUE AND ($2::UUID IS NULL OR id != $2)
       RETURNING id`, [userId, exceptSessionId ?? null]);
        await pool.query(`UPDATE auth.refresh_tokens SET is_revoked = TRUE, revoked_at = NOW()
       WHERE user_id = $1 AND is_revoked = FALSE`, [userId]);
        await auditService.log({
            userId,
            action: "user.logged_out_all",
            metadata: { sessionsRevoked: result.rowCount },
        });
        return result.rowCount ?? 0;
    }
    async resetPassword(email, otp, newPassword) {
        await otpService.verifyOtp(email, otp, "password_reset");
        const user = await this.findUserByEmail(email);
        if (!user) {
            throw AppError.notFound("User not found");
        }
        const pool = getPool();
        const passwordHash = await hashPassword(newPassword);
        const history = await pool.query(`SELECT password_hash FROM auth.password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`, [user.id]);
        for (const row of history.rows) {
            if (await verifyPassword(row.password_hash, newPassword)) {
                throw AppError.conflict("Cannot reuse a recent password");
            }
        }
        if (user.password_hash && (await verifyPassword(user.password_hash, newPassword))) {
            throw AppError.conflict("New password must be different from current password");
        }
        await pool.query(`UPDATE auth.users SET password_hash = $1 WHERE id = $2`, [passwordHash, user.id]);
        await pool.query(`INSERT INTO auth.password_history (user_id, password_hash) VALUES ($1, $2)`, [
            user.id,
            passwordHash,
        ]);
        await this.logoutAll(user.id);
        await auditService.log({
            userId: user.id,
            action: "user.password_reset",
        });
    }
    async getMe(userId) {
        const user = await this.findUserById(userId);
        if (!user)
            throw AppError.notFound("User not found");
        const roles = await rbacService.getUserRoles(userId);
        const permissions = await rbacService.getUserPermissions(userId);
        return rbacService.mapUserRow(user, roles, permissions);
    }
    async createAuthenticatedSession(userId, device, ctx = {}) {
        const user = await this.findUserById(userId);
        if (!user)
            throw AppError.notFound("User not found");
        this.checkAccountLock(user);
        const deviceId = await this.registerDevice(user.id, device);
        const { sessionId, refreshToken } = await this.createSession(user.id, deviceId, ctx);
        return this.buildAuthResponse(user, sessionId, refreshToken, deviceId);
    }
}
export const authService = new AuthService();
