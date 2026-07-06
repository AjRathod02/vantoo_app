import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { isPlatformEnabled, serviceFetch } from "@/lib/platform/client";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlatformEnabled()) return NextResponse.json({ earnings: [] });

  try {
    const earnings = await serviceFetch<Array<Record<string, unknown>>>("rider", "/v1/riders/earnings", { userId: user.id });
    return NextResponse.json({ earnings });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
