import { NextResponse } from "next/server";
import {
  getActiveFlashOffers,
  getSponsoredRestaurants,
} from "@/lib/restaurants/promotions";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { requireAdminAuth, adminErrorResponse } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import { z } from "zod";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("view") === "admin") {
    try {
      const ctx = await requireAdminAuth();
      if (
        !hasPermission(ctx.permissions, "vendors", "read") &&
        !hasPermission(ctx.permissions, "settings", "read")
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!hasAdminClient()) {
        return NextResponse.json({
          packages: [],
          sponsorships: [],
          offers: await getActiveFlashOffers(),
        });
      }
      const supabase = createAdminClient();
      const [{ data: packages }, { data: sponsorships }, { data: offers }] =
        await Promise.all([
          supabase.from("sponsorship_packages").select("*").order("price"),
          supabase
            .from("restaurant_sponsorships")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("restaurant_flash_offers")
            .select("*")
            .order("ends_at", { ascending: false }),
        ]);
      return NextResponse.json({
        packages: packages ?? [],
        sponsorships: sponsorships ?? [],
        offers: offers ?? [],
      });
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const [sponsored, offers] = await Promise.all([
    getSponsoredRestaurants(),
    getActiveFlashOffers(searchParams.get("restaurantId") ?? undefined),
  ]);
  return NextResponse.json({ sponsored, offers });
}

const patchSchema = z.object({
  sponsorshipId: z.string().optional(),
  status: z.enum(["approved", "active", "rejected", "expired"]).optional(),
  package: z
    .object({
      id: z.string(),
      price: z.number().optional(),
      durationDays: z.number().optional(),
      isActive: z.boolean().optional(),
    })
    .optional(),
});

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (
      !hasPermission(ctx.permissions, "vendors", "update") &&
      !hasPermission(ctx.permissions, "settings", "update")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database required" }, { status: 503 });
    }
    const body = patchSchema.parse(await request.json());
    const supabase = createAdminClient();

    if (body.sponsorshipId && body.status) {
      const patch: Record<string, unknown> = {
        status: body.status,
        updated_at: new Date().toISOString(),
      };
      if (body.status === "active" || body.status === "approved") {
        patch.starts_at = new Date().toISOString();
        patch.ends_at = new Date(Date.now() + 7 * 864e5).toISOString();
        patch.status = "active";
      }
      await supabase
        .from("restaurant_sponsorships")
        .update(patch)
        .eq("id", body.sponsorshipId);
      return NextResponse.json({ ok: true });
    }

    if (body.package) {
      await supabase
        .from("sponsorship_packages")
        .update({
          ...(body.package.price != null ? { price: body.package.price } : {}),
          ...(body.package.durationDays != null
            ? { duration_days: body.package.durationDays }
            : {}),
          ...(body.package.isActive != null
            ? { is_active: body.package.isActive }
            : {}),
        })
        .eq("id", body.package.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
