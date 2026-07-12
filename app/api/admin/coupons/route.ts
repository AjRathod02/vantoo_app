import { NextResponse } from "next/server";
import { requireAdminAuth, adminErrorResponse } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";

export async function GET() {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "notifications", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) return NextResponse.json({ coupons: [] });

    const { data, error } = await createAdminClient()
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ coupons: data ?? [] });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "notifications", "create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json();
    const code = String(body.code ?? "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }
    if (!["percent", "fixed"].includes(body.discount_type)) {
      return NextResponse.json({ error: "Invalid discount_type" }, { status: 400 });
    }
    if (!(Number(body.discount_value) > 0)) {
      return NextResponse.json({ error: "discount_value must be > 0" }, { status: 400 });
    }

    const { data, error } = await createAdminClient()
      .from("coupons")
      .insert({
        code,
        description: body.description ?? "",
        discount_type: body.discount_type,
        discount_value: Number(body.discount_value),
        min_order_amount: Number(body.min_order_amount ?? 0),
        max_discount: body.max_discount != null && body.max_discount !== ""
          ? Number(body.max_discount)
          : null,
        max_uses: body.max_uses != null && body.max_uses !== ""
          ? Number(body.max_uses)
          : null,
        starts_at: body.starts_at || null,
        expires_at: body.expires_at || null,
        is_active: body.is_active !== false,
        service: body.service || null,
      })
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "create",
      resource: "notifications",
      resourceId: data.id,
      details: { coupon: code },
    });

    return NextResponse.json({ coupon: data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "notifications", "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json();
    const { id, ...rest } = body;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const allowed = [
      "code",
      "description",
      "discount_type",
      "discount_value",
      "min_order_amount",
      "max_discount",
      "max_uses",
      "starts_at",
      "expires_at",
      "is_active",
      "service",
    ] as const;

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    for (const key of allowed) {
      if (rest[key] !== undefined) {
        if (key === "code") patch.code = String(rest.code).trim().toUpperCase();
        else if (key === "max_discount" || key === "max_uses" || key === "starts_at" || key === "expires_at" || key === "service") {
          patch[key] = rest[key] === "" || rest[key] == null ? null : rest[key];
        } else {
          patch[key] = rest[key];
        }
      }
    }

    const { data, error } = await createAdminClient()
      .from("coupons")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "update",
      resource: "notifications",
      resourceId: id,
      details: patch,
    });

    return NextResponse.json({ coupon: data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "notifications", "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await createAdminClient().from("coupons").delete().eq("id", id);
    if (error) throw error;

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "delete",
      resource: "notifications",
      resourceId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
