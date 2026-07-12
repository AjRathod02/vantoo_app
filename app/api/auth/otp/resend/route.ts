import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminClient } from "@/utils/supabase/admin";
import {
  findCustomerByEmail,
  findCustomerByPhone,
  issueOtp,
} from "@/lib/auth/otp";

const schema = z.object({
  purpose: z.enum(["password_reset", "email_verify", "phone_verify"]),
  channel: z.enum(["email", "sms"]).default("email"),
  email: z.string().email().optional(),
  phone: z.string().min(8).optional(),
});

export async function POST(request: Request) {
  if (!hasAdminClient()) {
    return NextResponse.json(
      { error: "Authentication service is not configured." },
      { status: 503 }
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { purpose, channel } = parsed.data;
  const email = parsed.data.email?.trim().toLowerCase();
  const phone = parsed.data.phone?.trim();

  if (channel === "sms") {
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }
    // Future-ready: allow issuing SMS OTP even without a full SMS provider
    const customer = await findCustomerByPhone(phone);
    const issued = await issueOtp({
      purpose,
      channel: "sms",
      phone,
      userId: customer?.id ?? null,
    });
    if (!issued.ok) {
      return NextResponse.json(
        {
          error: issued.error,
          resendAvailableAt: issued.resendAvailableAt,
        },
        { status: issued.status }
      );
    }
    return NextResponse.json({
      message: issued.delivered
        ? "A new code was sent to your phone."
        : "SMS delivery is not configured yet. Try email verification.",
      expiresAt: issued.expiresAt,
      resendAvailableAt: issued.resendAvailableAt,
      channel: "sms",
      smsReady: issued.delivered,
      ...(issued.otp ? { debugOtp: issued.otp } : {}),
    });
  }

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const customer = await findCustomerByEmail(email);
  if (!customer && purpose !== "email_verify") {
    // Don't leak existence for password reset resend
    return NextResponse.json({
      message: "If an account exists, a new code was sent.",
      expiresInSeconds: 15 * 60,
    });
  }

  const issued = await issueOtp({
    purpose,
    channel: "email",
    email,
    userId: customer?.id ?? null,
  });

  if (!issued.ok) {
    return NextResponse.json(
      {
        error: issued.error,
        resendAvailableAt: issued.resendAvailableAt,
      },
      { status: issued.status }
    );
  }

  return NextResponse.json({
    message: "A new verification code was sent to your email.",
    expiresAt: issued.expiresAt,
    resendAvailableAt: issued.resendAvailableAt,
    channel: "email",
    ...(issued.otp ? { debugOtp: issued.otp } : {}),
  });
}
