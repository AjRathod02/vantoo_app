import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { isPlatformEnabled } from "@/lib/platform/client";
import { applyVendor } from "@/lib/platform/vendors";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlatformEnabled()) {
    return NextResponse.json({ error: "Platform mode required" }, { status: 503 });
  }

  const body = await request.json();
  try {
    const vendor = await applyVendor(user.id, body);
    return NextResponse.json({ vendor }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Application failed" },
      { status: 400 }
    );
  }
}
