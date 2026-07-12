import { sendEmail, getAppOrigin } from "./send";
import {
  emailVerificationEmail,
  passwordResetEmail,
  transactionalNoticeEmail,
  welcomeEmail,
} from "./templates";
import type { EmailTemplateId } from "./types";

export { sendEmail, getAppOrigin, isEmailConfigured } from "./send";
export type {
  EmailTemplateId,
  SendEmailInput,
  SendEmailResult,
  SendEmailError,
} from "./types";

export async function sendPasswordResetEmail(input: {
  to: string;
  customerName: string;
  resetUrl: string;
  expiresMinutes?: number;
}) {
  const expiresMinutes = input.expiresMinutes ?? 30;
  const content = passwordResetEmail({
    customerName: input.customerName,
    resetUrl: input.resetUrl,
    expiresMinutes,
  });
  return sendEmail({
    to: input.to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    templateId: "password_reset",
    tags: [{ name: "category", value: "password_reset" }],
  });
}

export async function sendWelcomeEmail(input: {
  to: string;
  customerName: string;
  origin?: string;
}) {
  const content = welcomeEmail({
    customerName: input.customerName,
    loginUrl: `${getAppOrigin(input.origin)}/login`,
  });
  return sendEmail({
    to: input.to,
    ...content,
    templateId: "welcome",
    tags: [{ name: "category", value: "welcome" }],
  });
}

export async function sendEmailVerificationEmail(input: {
  to: string;
  customerName: string;
  verifyUrl: string;
  expiresMinutes?: number;
}) {
  const content = emailVerificationEmail({
    customerName: input.customerName,
    verifyUrl: input.verifyUrl,
    expiresMinutes: input.expiresMinutes ?? 30,
  });
  return sendEmail({
    to: input.to,
    ...content,
    templateId: "email_verification",
    tags: [{ name: "category", value: "email_verification" }],
  });
}

export async function sendTransactionalEmail(input: {
  to: string;
  customerName: string;
  templateId: Exclude<
    EmailTemplateId,
    "welcome" | "password_reset" | "email_verification" | "promotional"
  >;
  subject: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const content = transactionalNoticeEmail(input);
  return sendEmail({
    to: input.to,
    ...content,
    templateId: input.templateId,
    tags: [{ name: "category", value: input.templateId }],
  });
}
