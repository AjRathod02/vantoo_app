import { NextResponse } from "next/server";
import { z } from "zod";
import { hasAdminClient } from "@/utils/supabase/admin";
import { verifyCustomerOtp } from "@/lib/auth/otp";
import { markEmailVerified } from "@/lib/auth/password";

const schema = z.object({
  purpose: z.enum(["password_reset", "email_verify", "phone_verify"]),
  otp: z.string().length(6),
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
    return NextResponse.json({ error: "Invalid verification request" }, { status: 400 });
  }

  const { purpose, otp, email, phone } = parsed.data;
  if (!email && !phone) {
    return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
  }

  const verified = await verifyCustomerOtp({
    purpose,
    otp,
    email: email?.trim().toLowerCase(),
    phone: phone?.trim(),
  });

  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }

  if (purpose === "email_verify" && verified.userId) {
    await markEmailVerified(verified.userId);
  }

  return NextResponse.json({
    ok: true,
    message: "Verification successful",
    userId: verified.userId,
  });
}
