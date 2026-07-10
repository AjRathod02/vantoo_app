import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";
import { listAllOrders } from "@/lib/server/orders";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "customers", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const db = createAdminClient();
    const [profile, addresses] = await Promise.all([
      db.from("profiles").select("*").eq("id", id).maybeSingle(),
      db.from("addresses").select("*").eq("user_id", id),
    ]);

    if (!profile.data) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const orders = (await listAllOrders()).filter((o) => o.userId === id);

    return NextResponse.json({
      customer: profile.data,
      addresses: addresses.data ?? [],
      orders,
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "customers", "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const allowed = ["name", "phone", "email"];
    const updates: Record<string, string> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { data, error } = await createAdminClient()
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "update",
      resource: "customers",
      resourceId: id,
      details: updates,
    });

    return NextResponse.json({ customer: data });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "customers", "delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    await createAdminClient().from("profiles").delete().eq("id", id);

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "delete",
      resource: "customers",
      resourceId: id,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
