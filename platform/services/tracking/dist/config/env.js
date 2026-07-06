import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(4010),
    HOST: z.string().default("0.0.0.0"),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    INTERNAL_SERVICE_KEY: z.string().min(16),
    CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001"),
});
let cached = null;
export function loadEnv() {
    if (cached)
        return cached;
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("Invalid tracking service env:", result.error.flatten().fieldErrors);
        process.exit(1);
    }
    cached = result.data;
    return cached;
}
