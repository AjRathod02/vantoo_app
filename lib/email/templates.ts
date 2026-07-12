const BRAND = {
  name: "Vantoo",
  primary: "#FF6B00",
  ink: "#1A1A1A",
  muted: "#6B7280",
  surface: "#FFF7F0",
  border: "#F3E8DE",
};

function layout(opts: {
  title: string;
  preheader: string;
  bodyHtml: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.surface};font-family:Montserrat,Segoe UI,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.surface};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid ${BRAND.border};overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 12px;text-align:center;">
              <div style="display:inline-block;width:40px;height:40px;line-height:40px;border-radius:10px;background:${BRAND.primary};color:#fff;font-weight:800;font-size:20px;">V</div>
              <div style="margin-top:10px;font-size:22px;font-weight:800;color:${BRAND.primary};letter-spacing:-0.02em;">${BRAND.name}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px;">
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 28px;border-top:1px solid ${BRAND.border};font-size:12px;line-height:1.5;color:${BRAND.muted};text-align:center;">
              You’re receiving this email because you have a ${BRAND.name} account.<br />
              © ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:${BRAND.primary};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;">${label}</a>`;
}

export function passwordResetEmail(input: {
  customerName: string;
  resetUrl: string;
  expiresMinutes: number;
}) {
  const name = input.customerName.trim() || "there";
  const subject = "Reset your Vantoo password";
  const text = [
    `Hi ${name},`,
    "",
    "Reset your password by opening the link below:",
    input.resetUrl,
    "",
    `This link is valid for ${input.expiresMinutes} minutes.`,
    "",
    "If you didn't request this, you can safely ignore this email.",
    "",
    "— Vantoo",
  ].join("\n");

  const html = layout({
    title: subject,
    preheader: `Password reset link — valid for ${input.expiresMinutes} minutes.`,
    bodyHtml: `
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">Reset your password</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.muted};">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${BRAND.muted};">
        Reset your password by clicking the button below.
      </p>
      <p style="margin:0 0 24px;text-align:center;">${button(input.resetUrl, "Reset Password")}</p>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:${BRAND.muted};">
        This link is valid for <strong style="color:${BRAND.ink};">${input.expiresMinutes} minutes</strong>.
      </p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
        If you didn’t request this, you can safely ignore this email. Your password will stay the same.
      </p>
      <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:${BRAND.muted};word-break:break-all;">
        Or paste this link into your browser:<br />
        <a href="${input.resetUrl}" style="color:${BRAND.primary};">${escapeHtml(input.resetUrl)}</a>
      </p>
    `,
  });

  return { subject, html, text };
}

export function welcomeEmail(input: { customerName: string; loginUrl: string }) {
  const name = input.customerName.trim() || "there";
  const subject = "Welcome to Vantoo";
  const text = [
    `Hi ${name},`,
    "",
    "Your Vantoo account is ready. Sign in to start ordering:",
    input.loginUrl,
    "",
    "— Vantoo",
  ].join("\n");
  const html = layout({
    title: subject,
    preheader: "Your Vantoo account is ready.",
    bodyHtml: `
      <h1 style="margin:0 0 12px;font-size:22px;">Welcome to Vantoo</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.muted};">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${BRAND.muted};">
        Your account has been created successfully. Log in to continue shopping.
      </p>
      <p style="margin:0;text-align:center;">${button(input.loginUrl, "Go to Login")}</p>
    `,
  });
  return { subject, html, text };
}

export function emailVerificationEmail(input: {
  customerName: string;
  verifyUrl: string;
  expiresMinutes: number;
}) {
  const name = input.customerName.trim() || "there";
  const subject = "Verify your Vantoo email";
  const text = [
    `Hi ${name},`,
    "",
    "Verify your email:",
    input.verifyUrl,
    "",
    `This link expires in ${input.expiresMinutes} minutes.`,
    "",
    "— Vantoo",
  ].join("\n");
  const html = layout({
    title: subject,
    preheader: "Confirm your email address for Vantoo.",
    bodyHtml: `
      <h1 style="margin:0 0 12px;font-size:22px;">Verify your email</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.muted};">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${BRAND.muted};">
        Confirm your email address to secure your Vantoo account.
      </p>
      <p style="margin:0 0 16px;text-align:center;">${button(input.verifyUrl, "Verify Email")}</p>
      <p style="margin:0;font-size:13px;color:${BRAND.muted};">Link expires in ${input.expiresMinutes} minutes.</p>
    `,
  });
  return { subject, html, text };
}

export function transactionalNoticeEmail(input: {
  subject: string;
  customerName: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  const name = input.customerName.trim() || "there";
  const text = [
    `Hi ${name},`,
    "",
    input.headline,
    "",
    input.body,
    ...(input.ctaUrl ? ["", input.ctaUrl] : []),
    "",
    "— Vantoo",
  ].join("\n");
  const html = layout({
    title: input.subject,
    preheader: input.headline,
    bodyHtml: `
      <h1 style="margin:0 0 12px;font-size:22px;">${escapeHtml(input.headline)}</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.muted};">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${BRAND.muted};white-space:pre-wrap;">${escapeHtml(input.body)}</p>
      ${
        input.ctaUrl && input.ctaLabel
          ? `<p style="margin:0;text-align:center;">${button(input.ctaUrl, escapeHtml(input.ctaLabel))}</p>`
          : ""
      }
    `,
  });
  return { subject: input.subject, html, text };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
