import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(4005),
    HOST: z.string().default("0.0.0.0"),
    DATABASE_URL: z.string().min(1),
    INTERNAL_SERVICE_KEY: z.string().min(16),
    NOTIFICATION_SERVICE_URL: z.string().default("http://localhost:4009"),
    TRACKING_SERVICE_URL: z.string().default("http://localhost:4010"),
    CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:3001"),
});
let cached = null;
export function loadEnv() {
    if (cached)
        return cached;
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error("Invalid rider service env:", result.error.flatten().fieldErrors);
        process.exit(1);
    }
    cached = result.data;
    return cached;
}
