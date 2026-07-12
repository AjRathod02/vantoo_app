import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin/auth";
import { canRead } from "@/lib/admin/rbac";
import { isPlatformEnabled } from "@/lib/platform/client";
import {
  listAdminVendors,
  approveVendor,
  rejectVendor,
  suspendVendor,
} from "@/lib/platform/vendors";

function authStatus(msg: string) {
  if (msg === "Unauthorized") return 401;
  if (msg === "Forbidden") return 403;
  return 500;
}

export async function GET(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!canRead(ctx.permissions, "vendors") && ctx.admin.role !== "super_admin" && ctx.admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isPlatformEnabled()) {
      return NextResponse.json({
        vendors: [],
        total: 0,
        warning: "Platform mode is off. Enable PLATFORM_ENABLED and start vendor service to load vendors.",
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const search = searchParams.get("search")?.toLowerCase() ?? "";

    let vendors;
    try {
      vendors = await listAdminVendors(ctx.admin.id, status === "all" ? undefined : status);
    } catch (e) {
      console.error("listAdminVendors failed:", e);
      return NextResponse.json({
        vendors: [],
        total: 0,
        warning:
          "Vendor service unreachable. Start it with `npm run platform:dev:vendor` (port 4004).",
      });
    }

    const filtered = search
      ? vendors.filter(
          (v) =>
            v.businessName.toLowerCase().includes(search) ||
            v.contactEmail.toLowerCase().includes(search) ||
            v.contactPhone.includes(search) ||
            v.id.toLowerCase().includes(search) ||
            (v.gstNumber ?? "").toLowerCase().includes(search)
        )
      : vendors;

    return NextResponse.json({ vendors: filtered, total: filtered.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: authStatus(msg) });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (
      !canRead(ctx.permissions, "vendors") &&
      ctx.admin.role !== "super_admin" &&
      ctx.admin.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isPlatformEnabled()) {
      return NextResponse.json({ error: "Platform mode required" }, { status: 503 });
    }

    const body = await request.json();
    const { action, vendorId, reason } = body as {
      action: "approve" | "reject" | "suspend" | "block";
      vendorId: string;
      reason?: string;
    };

    if (action === "approve") {
      const vendor = await approveVendor(ctx.admin.id, vendorId);
      return NextResponse.json({ vendor });
    }
    if (action === "reject") {
      const vendor = await rejectVendor(
        ctx.admin.id,
        vendorId,
        reason ?? "Does not meet requirements"
      );
      return NextResponse.json({ vendor });
    }
    if (action === "suspend" || action === "block") {
      const vendor = await suspendVendor(ctx.admin.id, vendorId);
      return NextResponse.json({ vendor });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: authStatus(msg) === 500 ? 400 : authStatus(msg) });
  }
}
