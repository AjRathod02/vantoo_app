import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(4001),
    HOST: z.string().default("0.0.0.0"),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    JWT_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRY: z.string().default("15m"),
    JWT_REFRESH_EXPIRY: z.string().default("30d"),
    JWT_ISSUER: z.string().default("vantoo-auth"),
    JWT_AUDIENCE: z.string().default("vantoo-platform"),
    OTP_EXPIRY_SECONDS: z.coerce.number().default(300),
    OTP_MAX_ATTEMPTS: z.coerce.number().default(3),
    OTP_RATE_LIMIT: z.coerce.number().default(5),
    OTP_RATE_WINDOW_SECONDS: z.coerce.number().default(3600),
    MAX_SESSIONS_PER_USER: z.coerce.number().default(10),
    ACCOUNT_LOCKOUT_ATTEMPTS: z.coerce.number().default(10),
    ACCOUNT_LOCKOUT_MINUTES: z.coerce.number().default(15),
    GOOGLE_CLIENT_ID: z.string().optional(),
    APPLE_CLIENT_ID: z.string().optional(),
    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});
let cached = null;
export function loadEnv() {
    if (cached)
        return cached;
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("Invalid environment configuration:", result.error.flatten().fieldErrors);
        process.exit(1);
    }
    cached = result.data;
    return cached;
}
