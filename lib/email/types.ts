export type EmailTemplateId =
  | "welcome"
  | "password_reset"
  | "email_verification"
  | "order_confirmation"
  | "payment_confirmation"
  | "refund_update"
  | "complaint_update"
  | "birthday_greeting"
  | "promotional";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  templateId: EmailTemplateId;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  ok: true;
  id: string;
  provider: "resend" | "console";
}

export interface SendEmailError {
  ok: false;
  error: string;
  provider: "resend" | "none";
}
