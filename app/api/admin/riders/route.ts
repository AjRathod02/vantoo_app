import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { isPlatformEnabled } from "@/lib/platform/client";
import { listAdminRiders, approveRider, rejectRider } from "@/lib/platform/riders";

export async function GET(request: Request) {
  try {
    const user = await requireAdmin();
    if (!isPlatformEnabled()) return NextResponse.json({ riders: [] });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const riders = await listAdminRiders(user.id, status);
    return NextResponse.json({ riders });
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
    const { action, riderId, reason } = body as {
      action: "approve" | "reject";
      riderId: string;
      reason?: string;
    };

    if (action === "approve") {
      const rider = await approveRider(user.id, riderId);
      return NextResponse.json({ rider });
    }
    if (action === "reject") {
      const rider = await rejectRider(user.id, riderId, reason ?? "Does not meet requirements");
      return NextResponse.json({ rider });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}
