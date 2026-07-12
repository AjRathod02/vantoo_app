import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin/auth";
import { canRead } from "@/lib/admin/rbac";
import { isPlatformEnabled } from "@/lib/platform/client";
import {
  listAdminRiders,
  approveRider,
  rejectRider,
  suspendRider,
} from "@/lib/platform/riders";

function authStatus(msg: string) {
  if (msg === "Unauthorized") return 401;
  if (msg === "Forbidden") return 403;
  return 500;
}

export async function GET(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!canRead(ctx.permissions, "riders") && ctx.admin.role !== "super_admin" && ctx.admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isPlatformEnabled()) {
      return NextResponse.json({
        riders: [],
        total: 0,
        warning: "Platform mode is off. Enable PLATFORM_ENABLED and start rider service to load riders.",
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const search = searchParams.get("search")?.toLowerCase() ?? "";

    let riders;
    try {
      riders = await listAdminRiders(ctx.admin.id, status === "all" ? undefined : status);
    } catch (e) {
      console.error("listAdminRiders failed:", e);
      return NextResponse.json({
        riders: [],
        total: 0,
        warning:
          "Rider service unreachable. Start it with `npm run platform:dev:rider` (port 4005).",
      });
    }

    const filtered = search
      ? riders.filter(
          (r) =>
            r.fullName.toLowerCase().includes(search) ||
            r.email.toLowerCase().includes(search) ||
            r.phone.includes(search) ||
            r.id.toLowerCase().includes(search) ||
            r.city.toLowerCase().includes(search) ||
            (r.vehicleNumber ?? "").toLowerCase().includes(search)
        )
      : riders;

    return NextResponse.json({ riders: filtered, total: filtered.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: authStatus(msg) });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (
      !canRead(ctx.permissions, "riders") &&
      ctx.admin.role !== "super_admin" &&
      ctx.admin.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isPlatformEnabled()) {
      return NextResponse.json({ error: "Platform mode required" }, { status: 503 });
    }

    const body = await request.json();
    const { action, riderId, reason } = body as {
      action: "approve" | "reject" | "suspend" | "block";
      riderId: string;
      reason?: string;
    };

    if (action === "approve") {
      const rider = await approveRider(ctx.admin.id, riderId);
      return NextResponse.json({ rider });
    }
    if (action === "reject") {
      const rider = await rejectRider(
        ctx.admin.id,
        riderId,
        reason ?? "Does not meet requirements"
      );
      return NextResponse.json({ rider });
    }
    if (action === "suspend" || action === "block") {
      const rider = await suspendRider(ctx.admin.id, riderId);
      return NextResponse.json({ rider });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: authStatus(msg) === 500 ? 400 : authStatus(msg) });
  }
}
