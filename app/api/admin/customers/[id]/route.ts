import { NextResponse } from "next/server";
import { requireAdminAuth, adminErrorResponse } from "@/lib/admin/auth";
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
    const [profile, addresses, payments, tickets, reviews] = await Promise.all([
      db.from("profiles").select("*").eq("id", id).maybeSingle(),
      db.from("addresses").select("*").eq("user_id", id),
      db
        .from("orders")
        .select("id, total, payment_method, payment_status, placed_at, status")
        .eq("user_id", id)
        .order("placed_at", { ascending: false })
        .limit(50),
      db
        .from("support_tickets")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
      db
        .from("product_reviews")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (!profile.data) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const orders = (await listAllOrders()).filter((o) => o.userId === id);
    const wallet = await db
      .from("referral_wallets")
      .select("*")
      .eq("user_id", id)
      .maybeSingle();

    return NextResponse.json({
      customer: profile.data,
      addresses: addresses.data ?? [],
      orders,
      payments: payments.data ?? [],
      complaints: tickets.data ?? [],
      reviews: reviews.data ?? [],
      wallet: wallet.data ?? null,
    });
  } catch (error) {
    return adminErrorResponse(error);
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
    const allowed = [
      "name",
      "phone",
      "email",
      "gender",
      "date_of_birth",
      "avatar_url",
      "account_status",
      "email_verified",
      "phone_verified",
    ] as const;

    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    // Map convenience action fields
    if (body.action === "suspend") updates.account_status = "suspended";
    if (body.action === "block") updates.account_status = "blocked";
    if (body.action === "activate") updates.account_status = "active";

    if (updates.account_status) {
      const status = String(updates.account_status);
      if (!["active", "suspended", "blocked", "deleted"].includes(status)) {
        return NextResponse.json({ error: "Invalid account status" }, { status: 400 });
      }
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
  } catch (error) {
    return adminErrorResponse(error);
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

    // Soft-delete by default for auditability
    await createAdminClient()
      .from("profiles")
      .update({ account_status: "deleted", name: "[deleted]" })
      .eq("id", id);

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "delete",
      resource: "customers",
      resourceId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
