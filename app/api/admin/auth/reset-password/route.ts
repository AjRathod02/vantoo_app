import { NextResponse } from "next/server";
import { z } from "zod";
import { findAdminByEmail, verifyOtp, updateAdminPassword, revokeAllSessions } from "@/lib/admin/db";
import { hashPassword, hashToken } from "@/lib/admin/crypto";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const admin = await findAdminByEmail(body.email);
    if (!admin) {
      return NextResponse.json({ error: "Invalid reset request" }, { status: 400 });
    }

    const valid = await verifyOtp(admin.id, hashToken(body.otp), "password_reset");
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    const passwordHash = await hashPassword(body.newPassword);
    await updateAdminPassword(admin.id, passwordHash);
    await revokeAllSessions(admin.id);

    return NextResponse.json({ message: "Password reset successful" });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
