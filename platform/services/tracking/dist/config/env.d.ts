import { z } from "zod";
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    HOST: z.ZodDefault<z.ZodString>;
    REDIS_URL: z.ZodDefault<z.ZodString>;
    INTERNAL_SERVICE_KEY: z.ZodString;
    CORS_ORIGINS: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    HOST: string;
    REDIS_URL: string;
    INTERNAL_SERVICE_KEY: string;
    CORS_ORIGINS: string;
}, {
    INTERNAL_SERVICE_KEY: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: number | undefined;
    HOST?: string | undefined;
    REDIS_URL?: string | undefined;
    CORS_ORIGINS?: string | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
export declare function loadEnv(): Env;
export {};
