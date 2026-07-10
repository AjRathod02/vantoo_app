import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";

export async function GET() {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "notifications", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) return NextResponse.json({ logs: [] });

    const { data } = await createAdminClient()
      .from("admin_notification_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ logs: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "notifications", "create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { channel, targetType, title, body: message, targetFilter } = body;

    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const { data, error } = await createAdminClient()
      .from("admin_notification_logs")
      .insert({
        sent_by: ctx.admin.id,
        channel: channel ?? "push",
        target_type: targetType ?? "all",
        target_filter: targetFilter ?? {},
        title,
        body: message ?? "",
        recipient_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "send",
      resource: "notifications",
      resourceId: data.id,
      details: { channel, targetType, title },
    });

    return NextResponse.json({ log: data, message: "Notification queued for delivery" });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
