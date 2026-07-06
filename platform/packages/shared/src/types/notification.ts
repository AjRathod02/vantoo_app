export type NotificationChannel = "push" | "sms" | "email" | "in_app" | "whatsapp";
export type NotificationStatus = "pending" | "sent" | "delivered" | "failed" | "read";

export interface Notification {
  id: string;
  userId: string | null;
  channel: NotificationChannel;
  templateName: string | null;
  title: string;
  body: string;
  data: Record<string, unknown>;
  status: NotificationStatus;
  referenceType: string | null;
  referenceId: string | null;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface SendNotificationInput {
  userId?: string;
  channel: NotificationChannel;
  templateName?: string;
  title?: string;
  body?: string;
  variables?: Record<string, string>;
  data?: Record<string, unknown>;
  referenceType?: string;
  referenceId?: string;
  recipient?: string;
}
