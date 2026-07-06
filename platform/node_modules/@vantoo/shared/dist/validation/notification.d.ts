import { z } from "zod";
export declare const sendNotificationSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    channel: z.ZodEnum<["push", "sms", "email", "in_app", "whatsapp"]>;
    templateName: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    referenceType: z.ZodOptional<z.ZodString>;
    referenceId: z.ZodOptional<z.ZodString>;
    recipient: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    channel: "sms" | "email" | "whatsapp" | "push" | "in_app";
    userId?: string | undefined;
    templateName?: string | undefined;
    title?: string | undefined;
    body?: string | undefined;
    variables?: Record<string, string> | undefined;
    data?: Record<string, unknown> | undefined;
    referenceType?: string | undefined;
    referenceId?: string | undefined;
    recipient?: string | undefined;
}, {
    channel: "sms" | "email" | "whatsapp" | "push" | "in_app";
    userId?: string | undefined;
    templateName?: string | undefined;
    title?: string | undefined;
    body?: string | undefined;
    variables?: Record<string, string> | undefined;
    data?: Record<string, unknown> | undefined;
    referenceType?: string | undefined;
    referenceId?: string | undefined;
    recipient?: string | undefined;
}>;
