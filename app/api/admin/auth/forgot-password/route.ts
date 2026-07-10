import { NextResponse } from "next/server";
import { z } from "zod";
import { findAdminByEmail, storeOtp } from "@/lib/admin/db";
import { generateOtp, hashToken } from "@/lib/admin/crypto";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json());
    const admin = await findAdminByEmail(email);

    if (admin) {
      const otp = generateOtp();
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      await storeOtp(admin.id, hashToken(otp), "password_reset", expires);

      if (process.env.NODE_ENV === "development") {
        console.log(`[Admin OTP] Password reset for ${email}: ${otp}`);
      }
    }

    return NextResponse.json({
      message: "If an account exists, a reset code has been sent to your email.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
