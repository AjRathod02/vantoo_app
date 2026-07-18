import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { isPlatformEnabled } from "@/lib/platform/client";
import { getRiderMe } from "@/lib/platform/riders";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlatformEnabled()) {
    return NextResponse.json({ rider: null, stats: null, availability: null, platformEnabled: false });
  }
  try {
    const data = await getRiderMe(user.id);
    return NextResponse.json({ ...data, platformEnabled: true });
  } catch (e) {
    console.error("rider/me platform unavailable:", e);
    return NextResponse.json({
      rider: null,
      stats: null,
      availability: null,
      platformEnabled: true,
      warning: "Rider service unavailable",
    });
  }
}
