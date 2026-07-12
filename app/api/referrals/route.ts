import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getReferralDashboard } from "@/lib/referral";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const origin = new URL(request.url).origin;
  const dashboard = await getReferralDashboard(user.id, user.name, origin);
  return NextResponse.json({ dashboard });
}
