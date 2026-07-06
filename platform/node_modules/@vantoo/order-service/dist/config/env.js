import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(4003),
    HOST: z.string().default("0.0.0.0"),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    INTERNAL_SERVICE_KEY: z.string().min(16),
    CATALOG_SERVICE_URL: z.string().default("http://localhost:4002"),
    NOTIFICATION_SERVICE_URL: z.string().default("http://localhost:4009"),
    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    DELIVERY_FEE: z.coerce.number().default(40),
    TAX_RATE: z.coerce.number().default(5),
    LOG_LEVEL: z.string().default("info"),
});
let cached = null;
export function loadEnv() {
    if (cached)
        return cached;
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("Invalid order service env:", result.error.flatten().fieldErrors);
        process.exit(1);
    }
    cached = result.data;
    return cached;
}
