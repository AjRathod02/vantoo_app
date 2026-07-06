import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { isPlatformEnabled } from "@/lib/platform/client";
import { listVendorDocuments, uploadVendorDocument } from "@/lib/platform/vendors";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlatformEnabled()) return NextResponse.json({ documents: [] });

  const documents = await listVendorDocuments(user.id);
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPlatformEnabled()) {
    return NextResponse.json({ error: "Platform mode required" }, { status: 503 });
  }

  const body = await request.json();
  try {
    const document = await uploadVendorDocument(user.id, body);
    return NextResponse.json({ document }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
}
