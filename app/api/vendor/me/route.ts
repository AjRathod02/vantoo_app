import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { isPlatformEnabled } from "@/lib/platform/client";
import { getVendorMe } from "@/lib/platform/vendors";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlatformEnabled()) {
    return NextResponse.json({ vendor: null, stats: null, platformEnabled: false });
  }
  const data = await getVendorMe(user.id);
  return NextResponse.json({ ...data, platformEnabled: true });
}
