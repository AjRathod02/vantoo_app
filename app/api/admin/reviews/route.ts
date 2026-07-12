import { NextResponse } from "next/server";
import { requireAdminAuth, adminErrorResponse } from "@/lib/admin/auth";
import { canRead, hasPermission } from "@/lib/admin/rbac";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";

export async function GET(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    const canView =
      canRead(ctx.permissions, "reviews") ||
      canRead(ctx.permissions, "products") ||
      canRead(ctx.permissions, "complaints");
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) {
      return NextResponse.json({ reviews: [], total: 0 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const status = searchParams.get("status") ?? "";
    const rating = searchParams.get("rating");
    const type = searchParams.get("type") ?? "";
    const userId = searchParams.get("user") ?? "";

    const db = createAdminClient();
    let query = db
      .from("product_reviews")
      .select(
        "id, product_id, user_id, order_id, rating, title, body, images, videos, verified_purchase, is_published, moderation_status, review_type, target_id, reviewer_name, created_at, deleted_at"
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (status === "published") query = query.eq("moderation_status", "published");
    if (status === "hidden") query = query.eq("moderation_status", "hidden");
    if (status === "deleted") query = query.eq("moderation_status", "deleted");
    if (status === "pending") query = query.eq("moderation_status", "pending");
    if (rating) query = query.eq("rating", Number(rating));
    if (type) query = query.eq("review_type", type);
    if (userId) query = query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) {
      // Columns may not exist yet â€” fall back to basic select
      const fallback = await db
        .from("product_reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (fallback.error) throw fallback.error;

      const profiles = await db.from("profiles").select("id, name");
      const nameById = new Map((profiles.data ?? []).map((p) => [p.id, p.name]));

      let reviews = (fallback.data ?? []).map((r) => ({
        id: r.id,
        product_id: r.product_id,
        user_id: r.user_id,
        order_id: r.order_id,
        rating: r.rating,
        title: r.title ?? "",
        body: r.body ?? "",
        images: r.images ?? [],
        videos: r.videos ?? [],
        verified_purchase: r.verified_purchase,
        is_published: r.is_published,
        moderation_status: r.moderation_status ?? (r.is_published ? "published" : "hidden"),
        review_type: r.review_type ?? "product",
        target_id: r.target_id ?? r.product_id,
        reviewer_name: r.reviewer_name || nameById.get(r.user_id) || "Customer",
        created_at: r.created_at,
        deleted_at: r.deleted_at ?? null,
      }));

      if (search) {
        reviews = reviews.filter(
          (r) =>
            r.body?.toLowerCase().includes(search) ||
            r.title?.toLowerCase().includes(search) ||
            r.reviewer_name?.toLowerCase().includes(search) ||
            r.product_id?.toLowerCase().includes(search)
        );
      }

      if (userId) {
        reviews = reviews.filter((r) => r.user_id === userId);
      }

      return NextResponse.json({ reviews, total: reviews.length });
    }

    const profiles = await db.from("profiles").select("id, name");
    const nameById = new Map((profiles.data ?? []).map((p) => [p.id, p.name]));

    let reviews = (data ?? []).map((r) => ({
      ...r,
      moderation_status: r.moderation_status ?? (r.is_published ? "published" : "hidden"),
      review_type: r.review_type ?? "product",
      target_id: r.target_id || r.product_id,
      reviewer_name: r.reviewer_name || nameById.get(r.user_id) || "Customer",
    }));

    if (search) {
      reviews = reviews.filter(
        (r) =>
          r.body?.toLowerCase().includes(search) ||
          r.title?.toLowerCase().includes(search) ||
          r.reviewer_name?.toLowerCase().includes(search) ||
          r.product_id?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ reviews, total: reviews.length });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    const canModerate =
      hasPermission(ctx.permissions, "reviews", "update") ||
      hasPermission(ctx.permissions, "products", "update") ||
      hasPermission(ctx.permissions, "complaints", "update");
    if (!canModerate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json();
    const { reviewId, action } = body as {
      reviewId: string;
      action: "hide" | "restore" | "delete";
    };

    if (!reviewId || !action) {
      return NextResponse.json({ error: "reviewId and action required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (action === "hide") {
      updates.moderation_status = "hidden";
      updates.is_published = false;
      updates.hidden_at = new Date().toISOString();
    } else if (action === "restore") {
      updates.moderation_status = "published";
      updates.is_published = true;
      updates.hidden_at = null;
      updates.deleted_at = null;
    } else if (action === "delete") {
      updates.moderation_status = "deleted";
      updates.is_published = false;
      updates.deleted_at = new Date().toISOString();
    }

    const { data, error } = await createAdminClient()
      .from("product_reviews")
      .update(updates)
      .eq("id", reviewId)
      .select()
      .single();

    if (error) {
      // Soft fallback without new columns
      if (action === "hide" || action === "delete") {
        await createAdminClient()
          .from("product_reviews")
          .update({ is_published: false })
          .eq("id", reviewId);
      } else {
        await createAdminClient()
          .from("product_reviews")
          .update({ is_published: true })
          .eq("id", reviewId);
      }
    }

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: action === "delete" ? "delete" : "update",
      resource: "reviews",
      resourceId: reviewId,
      details: { action },
    });

    return NextResponse.json({ review: data, success: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    const canDelete =
      hasPermission(ctx.permissions, "reviews", "delete") ||
      hasPermission(ctx.permissions, "products", "delete");
    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("id");
    if (!reviewId) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    await createAdminClient()
      .from("product_reviews")
      .update({
        moderation_status: "deleted",
        is_published: false,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "delete",
      resource: "reviews",
      resourceId: reviewId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
