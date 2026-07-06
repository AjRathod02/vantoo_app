import { z } from "zod";
export const sendNotificationSchema = z.object({
    userId: z.string().uuid().optional(),
    channel: z.enum(["push", "sms", "email", "in_app", "whatsapp"]),
    templateName: z.string().optional(),
    title: z.string().max(200).optional(),
    body: z.string().max(2000).optional(),
    variables: z.record(z.string()).optional(),
    data: z.record(z.unknown()).optional(),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
    recipient: z.string().optional(),
});
