import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { generateOtp, hashToken } from "@/lib/admin/crypto";

export type OtpPurpose = "password_reset" | "email_verify" | "phone_verify";
export type OtpChannel = "email" | "sms";

const OTP_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export async function findCustomerByEmail(email: string) {
  if (!hasAdminClient()) return null;
  const normalized = email.trim().toLowerCase();
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id, email, name, phone")
    .eq("email", normalized)
    .maybeSingle();
  return data;
}

export async function findCustomerByPhone(phone: string) {
  if (!hasAdminClient()) return null;
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id, email, name, phone")
    .eq("phone", phone.trim())
    .maybeSingle();
  return data;
}

export async function issueOtp(input: {
  purpose: OtpPurpose;
  channel: OtpChannel;
  email?: string | null;
  phone?: string | null;
  userId?: string | null;
}): Promise<
  | {
      ok: true;
      expiresAt: string;
      resendAvailableAt: string;
      delivered: boolean;
      otp?: string;
    }
  | { ok: false; error: string; status: number; resendAvailableAt?: string }
> {
  if (!hasAdminClient()) {
    return { ok: false, error: "Authentication service is not configured.", status: 503 };
  }

  const db = createAdminClient();
  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone?.trim() || null;

  let recentQuery = db
    .from("customer_otp_tokens")
    .select("created_at")
    .eq("purpose", input.purpose)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (email) recentQuery = recentQuery.eq("email", email);
  else if (phone) recentQuery = recentQuery.eq("phone", phone);

  const { data: recent } = await recentQuery.maybeSingle();
  if (recent?.created_at) {
    const created = new Date(recent.created_at).getTime();
    if (Date.now() - created < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        error: "Please wait before requesting another code.",
        status: 429,
        resendAvailableAt: new Date(created + RESEND_COOLDOWN_MS).toISOString(),
      };
    }
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const { error } = await db.from("customer_otp_tokens").insert({
    user_id: input.userId ?? null,
    email,
    phone,
    token_hash: hashToken(otp),
    purpose: input.purpose,
    channel: input.channel,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    // Table may not exist yet — surface a clear message
    if (error.message?.includes("schema cache") || error.code === "42P01") {
      return {
        ok: false,
        error: "OTP storage is not migrated. Run supabase/migrations/008_e2e_gaps_coupons_categories_otp.sql",
        status: 503,
      };
    }
    return { ok: false, error: error.message, status: 500 };
  }

  let delivered = false;
  if (input.channel === "email" && email) {
    try {
      const { sendEmail } = await import("@/lib/email");
      const subject =
        input.purpose === "email_verify"
          ? "Your Vantoo verification code"
          : "Your Vantoo security code";
      const text = [
        `Your Vantoo code is ${otp}.`,
        "",
        "It expires in 15 minutes.",
        "If you did not request this, you can ignore this email.",
      ].join("\n");
      const sent = await sendEmail({
        to: email,
        subject,
        text,
        html: `<p>Your Vantoo code is <strong>${otp}</strong>.</p><p>It expires in 15 minutes.</p>`,
        templateId:
          input.purpose === "email_verify"
            ? "email_verification"
            : "password_reset",
        tags: [{ name: "category", value: input.purpose }],
      });
      delivered = sent.ok;
      if (!sent.ok) {
        console.error(`[Customer OTP] email delivery failed: ${sent.error}`);
      }
    } catch (err) {
      console.error("[Customer OTP] email send error:", err);
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Customer OTP] ${input.purpose} via ${input.channel} for ${email ?? phone}: ${otp}`
    );
  }

  return {
    ok: true,
    expiresAt: expiresAt.toISOString(),
    resendAvailableAt: new Date(Date.now() + RESEND_COOLDOWN_MS).toISOString(),
    delivered,
    ...(process.env.NODE_ENV === "development" ? { otp } : {}),
  };
}

export async function verifyCustomerOtp(input: {
  purpose: OtpPurpose;
  otp: string;
  email?: string | null;
  phone?: string | null;
}): Promise<{ ok: true; userId: string | null } | { ok: false; error: string }> {
  if (!hasAdminClient()) {
    return { ok: false, error: "Authentication service is not configured." };
  }

  const db = createAdminClient();
  const email = input.email?.trim().toLowerCase() || null;
  const phone = input.phone?.trim() || null;
  const tokenHash = hashToken(input.otp);

  let query = db
    .from("customer_otp_tokens")
    .select("id, user_id, expires_at")
    .eq("purpose", input.purpose)
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (email) query = query.eq("email", email);
  else if (phone) query = query.eq("phone", phone);

  const { data } = await query.maybeSingle();
  if (!data) return { ok: false, error: "Invalid or expired OTP" };
  if (new Date(data.expires_at as string) < new Date()) {
    return { ok: false, error: "Invalid or expired OTP" };
  }

  await db
    .from("customer_otp_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { ok: true, userId: (data.user_id as string | null) ?? null };
}
