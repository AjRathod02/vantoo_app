import { NextResponse } from "next/server";
import { requireAdminAuth, adminErrorResponse } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";
import { categories as staticCategories } from "@/lib/data/categories";

const SERVICES = ["food", "grocery", "medicine", "ecommerce"] as const;

export async function GET() {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "products", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) {
      return NextResponse.json({
        categories: staticCategories.map((c, i) => ({
          ...c,
          sort_order: i,
          is_active: true,
        })),
      });
    }

    const { data, error } = await createAdminClient()
      .from("product_categories")
      .select("*")
      .order("service")
      .order("sort_order");

    if (error) throw error;
    return NextResponse.json({ categories: data ?? [] });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "products", "create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json();
    const id = String(body.id ?? "").trim();
    const name = String(body.name ?? "").trim();
    const service = String(body.service ?? "").trim();

    if (!id || !name) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }
    if (!SERVICES.includes(service as (typeof SERVICES)[number])) {
      return NextResponse.json({ error: "Invalid service" }, { status: 400 });
    }

    const { data, error } = await createAdminClient()
      .from("product_categories")
      .insert({
        id,
        name,
        service,
        icon: body.icon || "Tag",
        image: body.image || "",
        sort_order: Number(body.sort_order ?? 0),
        is_active: body.is_active !== false,
      })
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "create",
      resource: "products",
      resourceId: data.id,
      details: { category: name },
    });

    return NextResponse.json({ category: data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "products", "update")) {
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

    const allowed = ["name", "service", "icon", "image", "sort_order", "is_active"] as const;
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    for (const key of allowed) {
      if (rest[key] !== undefined) patch[key] = rest[key];
    }

    const { data, error } = await createAdminClient()
      .from("product_categories")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "update",
      resource: "products",
      resourceId: id,
      details: patch,
    });

    return NextResponse.json({ category: data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "products", "delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await createAdminClient()
      .from("product_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "delete",
      resource: "products",
      resourceId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
