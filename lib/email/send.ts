import { Resend } from "resend";
import type { SendEmailError, SendEmailInput, SendEmailResult } from "./types";

function getFromAddress() {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Vantoo <onboarding@resend.dev>"
  );
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getAppOrigin(requestOrigin?: string) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "";
  if (configured) return configured.replace(/\/$/, "");
  if (requestOrigin) return requestOrigin.replace(/\/$/, "");
  return "http://localhost:3000";
}

/**
 * Production email sender via Resend.
 * In development without RESEND_API_KEY, logs to the console instead of silently succeeding.
 */
export async function sendEmail(
  input: SendEmailInput
): Promise<SendEmailResult | SendEmailError> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = getFromAddress();
  const replyTo =
    input.replyTo?.trim() || process.env.EMAIL_REPLY_TO?.trim() || undefined;

  if (!apiKey) {
    const message =
      "Email service is not configured. Set RESEND_API_KEY (and EMAIL_FROM) in environment variables.";
    console.error(`[Email] ${message} template=${input.templateId} to=${input.to}`);
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[Email:dev-fallback] to=${input.to} subject="${input.subject}"\n${input.text}`
      );
      return { ok: true, id: `dev-${Date.now()}`, provider: "console" };
    }
    return { ok: false, error: message, provider: "none" };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo,
      tags: input.tags,
    });

    if (error) {
      const detail = error.message || JSON.stringify(error);
      console.error(
        `[Email] Resend failed template=${input.templateId} to=${input.to}:`,
        detail
      );
      return { ok: false, error: detail, provider: "resend" };
    }

    const id = data?.id ?? `resend-${Date.now()}`;
    console.info(
      `[Email] sent template=${input.templateId} to=${input.to} id=${id}`
    );
    return { ok: true, id, provider: "resend" };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown email error";
    console.error(
      `[Email] Unexpected send failure template=${input.templateId} to=${input.to}:`,
      detail
    );
    return { ok: false, error: detail, provider: "resend" };
  }
}
