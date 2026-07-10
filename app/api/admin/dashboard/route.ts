import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin/auth";
import { getDashboardStats, getChartData } from "@/lib/admin/analytics";
import { canRead } from "@/lib/admin/rbac";

export async function GET() {
  try {
    const ctx = await requireAdminAuth();
    if (!canRead(ctx.permissions, "dashboard")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [stats, charts] = await Promise.all([
      getDashboardStats(ctx.admin.id),
      getChartData(),
    ]);

    return NextResponse.json({ stats, charts });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
