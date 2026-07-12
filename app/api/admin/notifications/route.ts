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

    if (!hasAdminClient()) return NextResponse.json({ logs: [] });

    const { data } = await createAdminClient()
      .from("admin_notification_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({ logs: data ?? [] });
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

    const body = await request.json();
    const {
      channel = "push",
      channels,
      targetType = "all",
      title,
      body: message,
      targetFilter,
      selectedUserIds,
    } = body as {
      channel?: string;
      channels?: string[];
      targetType?: string;
      title: string;
      body?: string;
      targetFilter?: Record<string, unknown>;
      selectedUserIds?: string[];
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const db = createAdminClient();
    const deliveryChannels = channels?.length
      ? channels
      : [channel];

    // Resolve recipients for in-app fan-out
    let recipientIds: string[] = [];
    if (targetType === "selected" && selectedUserIds?.length) {
      recipientIds = selectedUserIds;
    } else if (targetType === "customers" || targetType === "all") {
      const { data } = await db
        .from("profiles")
        .select("id")
        .eq("role", "customer")
        .limit(targetType === "all" ? 5000 : 5000);
      recipientIds = (data ?? []).map((p) => p.id);
    }

    // In-app notifications (user_notifications table from referrals mig)
    let inAppCount = 0;
    if (deliveryChannels.includes("in_app") || deliveryChannels.includes("push")) {
      if (recipientIds.length > 0) {
        const batch = recipientIds.slice(0, 500).map((userId) => ({
          user_id: userId,
          title,
          body: message ?? "",
          type: "admin",
          read: false,
          metadata: { channel: "in_app", sent_by: ctx.admin.id },
        }));
        const { error: nErr } = await db.from("user_notifications").insert(batch);
        if (!nErr) inAppCount = batch.length;
      }
    }

    const { data, error } = await db
      .from("admin_notification_logs")
      .insert({
        sent_by: ctx.admin.id,
        channel: deliveryChannels.join(","),
        target_type: targetType,
        target_filter: {
          ...(targetFilter ?? {}),
          selectedUserIds: selectedUserIds ?? [],
          channels: deliveryChannels,
        },
        title,
        body: message ?? "",
        recipient_count: Math.max(inAppCount, recipientIds.length),
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
      details: { channels: deliveryChannels, targetType, title, recipients: recipientIds.length },
    });

    return NextResponse.json({
      log: data,
      message: `Notification queued · ${deliveryChannels.join(", ")} · ${recipientIds.length || inAppCount} recipients`,
      recipientCount: recipientIds.length || inAppCount,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
