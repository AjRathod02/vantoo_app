import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { generateToken, hashToken } from "@/lib/admin/crypto";
import { findCustomerByEmail } from "@/lib/auth/otp";
import { getAppOrigin, sendPasswordResetEmail } from "@/lib/email";

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
export const PASSWORD_RESET_TTL_MINUTES = 30;
const RESEND_COOLDOWN_MS = 60 * 1000;

export async function issuePasswordResetLink(input: {
  email: string;
  origin?: string;
}): Promise<
  | {
      ok: true;
      expiresAt: string;
      /** Only returned in development when email falls back to console */
      debugResetUrl?: string;
    }
  | { ok: false; error: string; status: number; resendAvailableAt?: string }
> {
  if (!hasAdminClient()) {
    return {
      ok: false,
      error: "Authentication service is not configured.",
      status: 503,
    };
  }

  const email = input.email.trim().toLowerCase();
  const customer = await findCustomerByEmail(email);

  // Always pretend success when account is missing (no email enumeration).
  if (!customer) {
    return {
      ok: true,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString(),
    };
  }

  const db = createAdminClient();

  const { data: recent } = await db
    .from("customer_otp_tokens")
    .select("created_at")
    .eq("purpose", "password_reset")
    .eq("email", email)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent?.created_at) {
    const created = new Date(recent.created_at).getTime();
    if (Date.now() - created < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        error: "Please wait before requesting another reset email.",
        status: 429,
        resendAvailableAt: new Date(created + RESEND_COOLDOWN_MS).toISOString(),
      };
    }
  }

  // Invalidate outstanding unused reset tokens for this email.
  await db
    .from("customer_otp_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("email", email)
    .eq("purpose", "password_reset")
    .is("used_at", null);

  const rawToken = generateToken(32);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  const { error } = await db.from("customer_otp_tokens").insert({
    user_id: customer.id,
    email,
    phone: null,
    token_hash: hashToken(rawToken),
    purpose: "password_reset",
    channel: "email",
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    if (error.message?.includes("schema cache") || error.code === "42P01") {
      return {
        ok: false,
        error:
          "Password reset storage is not migrated. Run supabase/migrations/008_e2e_gaps_coupons_categories_otp.sql",
        status: 503,
      };
    }
    console.error("[PasswordReset] token insert failed:", error.message);
    return { ok: false, error: error.message, status: 500 };
  }

  const origin = getAppOrigin(input.origin);
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;

  const sent = await sendPasswordResetEmail({
    to: email,
    customerName: customer.name || "there",
    resetUrl,
    expiresMinutes: PASSWORD_RESET_TTL_MINUTES,
  });

  if (!sent.ok) {
    // Roll back unused token so a failed send doesn't leave a dangling secret.
    await db
      .from("customer_otp_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("email", email)
      .eq("purpose", "password_reset")
      .eq("token_hash", hashToken(rawToken));

    return {
      ok: false,
      error: `Could not send reset email: ${sent.error}`,
      status: 502,
    };
  }

  return {
    ok: true,
    expiresAt: expiresAt.toISOString(),
    ...(sent.provider === "console" ? { debugResetUrl: resetUrl } : {}),
  };
}

export async function consumePasswordResetToken(input: {
  email: string;
  token: string;
}): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string; status: number }
> {
  if (!hasAdminClient()) {
    return {
      ok: false,
      error: "Authentication service is not configured.",
      status: 503,
    };
  }

  const email = input.email.trim().toLowerCase();
  const token = input.token.trim();
  if (!token || token.length < 20) {
    return { ok: false, error: "Invalid or expired reset link.", status: 400 };
  }

  const db = createAdminClient();
  const tokenHash = hashToken(token);

  const { data } = await db
    .from("customer_otp_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("purpose", "password_reset")
    .eq("email", email)
    .eq("token_hash", tokenHash)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return { ok: false, error: "Invalid or expired reset link.", status: 400 };
  }
  if (data.used_at) {
    return {
      ok: false,
      error: "This reset link has already been used.",
      status: 400,
    };
  }
  if (new Date(data.expires_at as string) < new Date()) {
    return { ok: false, error: "This reset link has expired.", status: 400 };
  }

  const { error: markError } = await db
    .from("customer_otp_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id)
    .is("used_at", null);

  if (markError) {
    return { ok: false, error: "Could not consume reset token.", status: 500 };
  }

  const userId = (data.user_id as string | null) ?? null;
  if (!userId) {
    const customer = await findCustomerByEmail(email);
    if (!customer) {
      return { ok: false, error: "Invalid or expired reset link.", status: 400 };
    }
    return { ok: true, userId: customer.id };
  }

  return { ok: true, userId };
}
