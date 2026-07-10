import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin/auth";
import { canRead } from "@/lib/admin/rbac";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";

export async function GET(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!canRead(ctx.permissions, "customers")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) {
      return NextResponse.json({ customers: [] });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase();
    const status = searchParams.get("status");

    let query = createAdminClient()
      .from("profiles")
      .select("id, name, email, phone, role, created_at")
      .eq("role", "customer")
      .order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    let customers = data ?? [];
    if (search) {
      customers = customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search) ||
          c.phone?.includes(search)
      );
    }

    return NextResponse.json({ customers, total: customers.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status = msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
