import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { isPlatformEnabled } from "@/lib/platform/client";
import { listAdminVendors, approveVendor, rejectVendor } from "@/lib/platform/vendors";

export async function GET(request: Request) {
  try {
    const user = await requireAdmin();
    if (!isPlatformEnabled()) return NextResponse.json({ vendors: [] });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const vendors = await listAdminVendors(user.id, status);
    return NextResponse.json({ vendors });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (!isPlatformEnabled()) {
      return NextResponse.json({ error: "Platform mode required" }, { status: 503 });
    }

    const body = await request.json();
    const { action, vendorId, reason } = body as {
      action: "approve" | "reject";
      vendorId: string;
      reason?: string;
    };

    if (action === "approve") {
      const vendor = await approveVendor(user.id, vendorId);
      return NextResponse.json({ vendor });
    }
    if (action === "reject") {
      const vendor = await rejectVendor(user.id, vendorId, reason ?? "Does not meet requirements");
      return NextResponse.json({ vendor });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
