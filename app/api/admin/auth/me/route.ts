import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin/auth";

export async function GET() {
  try {
    const ctx = await requireAdminAuth();
    return NextResponse.json({
      admin: ctx.admin,
      permissions: ctx.permissions,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
