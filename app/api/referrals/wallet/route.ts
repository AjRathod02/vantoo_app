import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { getReferralWallet } from "@/lib/referral";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const wallet = await getReferralWallet(user.id);
  return NextResponse.json({ wallet });
}
