import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { isPlatformEnabled } from "@/lib/platform/client";
import { uploadRiderDocument } from "@/lib/platform/riders";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlatformEnabled()) {
    return NextResponse.json({ error: "Platform mode required" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const doc = await uploadRiderDocument(user.id, body);
    return NextResponse.json({ doc }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 }
    );
  }
}
