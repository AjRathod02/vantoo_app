import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin/auth";
import { canRead } from "@/lib/admin/rbac";
import { getOrder } from "@/lib/server/orders";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ctx = await requireAdminAuth();
    if (!canRead(ctx.permissions, "orders") && !canRead(ctx.permissions, "tracking")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const order = await getOrder(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let customer: Record<string, unknown> | null = null;
    let timeline: Array<{ status: string; label: string; note: string; created_at: string }> = [];

    if (hasAdminClient() && order.userId) {
      const db = createAdminClient();
      const [profile, history] = await Promise.all([
        db
          .from("profiles")
          .select("id, name, email, phone, avatar_url")
          .eq("id", order.userId)
          .maybeSingle(),
        db
          .from("order_status_history")
          .select("status, label, note, created_at")
          .eq("order_id", id)
          .order("created_at", { ascending: true }),
      ]);
      customer = profile.data;
      timeline = history.data ?? [];
    }

    if (timeline.length === 0 && order.statusHistory?.length) {
      timeline = order.statusHistory.map((h) => ({
        status: h.status,
        label: h.status.replace(/_/g, " "),
        note: "",
        created_at: h.at,
      }));
    }

    if (timeline.length === 0) {
      timeline = [
        {
          status: order.status,
          label: order.status.replace(/_/g, " "),
          note: "Current status",
          created_at: order.placedAt,
        },
      ];
    }

    const vendor = {
      name: order.tracking?.storeName ?? "Vendor",
      lat: order.tracking?.storeLat ?? null,
      lng: order.tracking?.storeLng ?? null,
    };

    const rider = {
      name: order.tracking?.riderName ?? null,
      phone: order.tracking?.riderPhone ?? null,
      rating: order.tracking?.riderRating ?? null,
      lat: order.tracking?.riderLat ?? null,
      lng: order.tracking?.riderLng ?? null,
    };

    return NextResponse.json({
      order,
      customer,
      vendor,
      rider,
      timeline,
      etaMinutes: order.tracking?.etaMinutes ?? null,
      distanceRemainingM: order.tracking?.distanceRemainingM ?? null,
      distanceKm: order.tracking?.distanceKm ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    const status = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
