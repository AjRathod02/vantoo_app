import { getPool } from "../db/pool.js";
import { getRedis } from "../db/redis.js";
import { loadEnv } from "../config/env.js";
import { generateOtp, hashToken } from "../utils/crypto.js";
import { AppError } from "../utils/errors.js";
import { ErrorCodes } from "@vantoo/shared";
import { logger } from "../utils/logger.js";
export class OtpService {
    async sendOtp(identifier, channel, purpose, ipAddress) {
        const env = loadEnv();
        const redis = getRedis();
        const rateLimitKey = `otp:rate:${identifier}`;
        const currentCount = await redis.incr(rateLimitKey);
        if (currentCount === 1) {
            await redis.expire(rateLimitKey, env.OTP_RATE_WINDOW_SECONDS);
        }
        if (currentCount > env.OTP_RATE_LIMIT) {
            throw AppError.rateLimited("Too many OTP requests. Please try again later.");
        }
        const otp = generateOtp();
        const otpHash = hashToken(otp);
        const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_SECONDS * 1000);
        const pool = getPool();
        const result = await pool.query(`INSERT INTO auth.otp_verifications (identifier, channel, purpose, otp_hash, max_attempts, expires_at, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`, [identifier, channel, purpose, otpHash, env.OTP_MAX_ATTEMPTS, expiresAt, ipAddress ?? null]);
        const otpId = result.rows[0].id;
        await redis.setex(`otp:${otpId}`, env.OTP_EXPIRY_SECONDS, otpHash);
        // In production, dispatch via notification service. Log for development.
        logger.info({ identifier, channel, purpose, otpId }, "OTP generated");
        if (env.NODE_ENV === "development") {
            logger.info({ otp }, "OTP code (development only)");
        }
        if (channel === "sms" || channel === "email" || channel === "whatsapp") {
            try {
                await fetch(`${env.NOTIFICATION_SERVICE_URL}/v1/notifications/send`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Internal-Key": env.INTERNAL_SERVICE_KEY,
                    },
                    body: JSON.stringify({
                        channel: channel === "whatsapp" ? "whatsapp" : channel === "email" ? "email" : "sms",
                        templateName: "otp_sms",
                        variables: { otp, minutes: String(Math.floor(env.OTP_EXPIRY_SECONDS / 60)) },
                        recipient: identifier,
                        title: "Vantoo OTP",
                        body: `Your Vantoo OTP is ${otp}. Valid for ${Math.floor(env.OTP_EXPIRY_SECONDS / 60)} minutes.`,
                    }),
                });
            }
            catch (err) {
                logger.warn({ err }, "Failed to dispatch OTP via notification service");
            }
        }
        return { expiresIn: env.OTP_EXPIRY_SECONDS, otpId };
    }
    async verifyOtp(identifier, otp, purpose) {
        const pool = getPool();
        const otpHash = hashToken(otp);
        const result = await pool.query(`SELECT id, otp_hash, attempts, max_attempts, expires_at
       FROM auth.otp_verifications
       WHERE identifier = $1 AND purpose = $2 AND is_verified = FALSE
       ORDER BY created_at DESC
       LIMIT 1`, [identifier, purpose]);
        if (result.rows.length === 0) {
            throw new AppError(ErrorCodes.INVALID_OTP, "No valid OTP found for this identifier", 400);
        }
        const record = result.rows[0];
        if (new Date() > record.expires_at) {
            throw new AppError(ErrorCodes.OTP_EXPIRED, "OTP has expired", 400);
        }
        if (record.attempts >= record.max_attempts) {
            throw new AppError(ErrorCodes.OTP_MAX_ATTEMPTS, "Maximum OTP attempts exceeded", 400);
        }
        await pool.query(`UPDATE auth.otp_verifications SET attempts = attempts + 1 WHERE id = $1`, [record.id]);
        if (record.otp_hash !== otpHash) {
            throw new AppError(ErrorCodes.INVALID_OTP, "Invalid OTP", 400);
        }
        await pool.query(`UPDATE auth.otp_verifications SET is_verified = TRUE, verified_at = NOW() WHERE id = $1`, [record.id]);
        const redis = getRedis();
        await redis.del(`otp:${record.id}`);
        return { verified: true, otpId: record.id };
    }
}
export const otpService = new OtpService();
