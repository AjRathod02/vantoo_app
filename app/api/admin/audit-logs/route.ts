import { NextResponse } from "next/server";
import { requireAdminAuth, adminErrorResponse } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";

export async function GET(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "audit_logs", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) return NextResponse.json({ logs: [] });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "100", 10);
    const resource = searchParams.get("resource");

    let query = createAdminClient()
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (resource) query = query.eq("resource", resource);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ logs: data ?? [] });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
