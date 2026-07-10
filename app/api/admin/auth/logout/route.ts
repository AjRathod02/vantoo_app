import { NextResponse } from "next/server";
import { getAdminFromCookies } from "@/lib/admin/auth";
import { revokeSession, recordLogout } from "@/lib/admin/db";
import { clearAdminCookies } from "@/lib/admin/cookies";

export async function POST() {
  const ctx = await getAdminFromCookies();
  if (ctx && ctx.sessionId !== "legacy") {
    await revokeSession(ctx.sessionId);
    await recordLogout(ctx.sessionId);
  }
  await clearAdminCookies();
  return NextResponse.json({ success: true });
}
