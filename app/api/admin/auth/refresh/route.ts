import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_REFRESH_COOKIE, signAccessToken } from "@/lib/admin/jwt";
import { hashToken } from "@/lib/admin/crypto";
import { findSessionByRefreshHash, findAdminById, touchSession } from "@/lib/admin/db";
import { setAdminCookies } from "@/lib/admin/cookies";
import { generateToken } from "@/lib/admin/crypto";
import { getRefreshTokenExpiry } from "@/lib/admin/jwt";
import { createAdminSession, revokeSession } from "@/lib/admin/db";

export async function POST() {
  const refreshToken = (await cookies()).get(ADMIN_REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  const session = await findSessionByRefreshHash(hashToken(refreshToken));
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const admin = await findAdminById(session.admin_id);
  if (!admin || admin.status !== "active") {
    return NextResponse.json({ error: "Account inactive" }, { status: 401 });
  }

  await revokeSession(session.id);

  const newRefresh = generateToken(48);
  const newRefreshHash = hashToken(newRefresh);
  const expiresAt = getRefreshTokenExpiry();
  const sessionId = await createAdminSession({
    adminId: admin.id,
    refreshTokenHash: newRefreshHash,
    deviceName: "Refreshed",
    browser: "",
    platform: "web",
    expiresAt,
  });

  const accessToken = await signAccessToken({
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    sessionId,
  });

  await setAdminCookies(accessToken, newRefresh);
  return NextResponse.json({ admin });
}
