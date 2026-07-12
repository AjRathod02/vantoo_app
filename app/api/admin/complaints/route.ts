import { NextResponse } from "next/server";
import { requireAdminAuth, adminErrorResponse } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { logAdminAction } from "@/lib/admin/audit";

function generateTicketNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VT-${ts}-${rand}`;
}

export async function GET(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "complaints", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasAdminClient()) return NextResponse.json({ tickets: [] });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const ticketId = searchParams.get("ticketId");
    const wantReplies = searchParams.get("replies") === "1";

    if (ticketId && wantReplies) {
      const { data: replies } = await createAdminClient()
        .from("support_ticket_replies")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      return NextResponse.json({ replies: replies ?? [] });
    }

    let query = createAdminClient()
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ tickets: data ?? [] });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "complaints", "create") &&
        !hasPermission(ctx.permissions, "complaints", "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    if (body.action === "reply") {
      const { data, error } = await createAdminClient()
        .from("support_ticket_replies")
        .insert({
          ticket_id: body.ticketId,
          author_type: "admin",
          author_id: ctx.admin.id,
          author_name: ctx.admin.name || ctx.admin.email,
          body: body.body,
          attachments: body.attachments ?? [],
        })
        .select()
        .single();
      if (error) throw error;
      await createAdminClient()
        .from("support_tickets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", body.ticketId);
      return NextResponse.json({ reply: data });
    }

    const { data, error } = await createAdminClient()
      .from("support_tickets")
      .insert({
        ticket_number: generateTicketNumber(),
        user_id: body.userId ?? null,
        user_type: body.userType ?? "customer",
        user_name: body.userName ?? "",
        user_email: body.userEmail ?? "",
        user_phone: body.userPhone ?? "",
        category: body.category ?? "other",
        priority: body.priority ?? "medium",
        subject: body.subject,
        description: body.description ?? "",
        order_id: body.orderId ?? null,
        assigned_to: body.assignedTo ?? ctx.admin.id,
        status: "assigned",
      })
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "create",
      resource: "complaints",
      resourceId: data.id,
    });

    return NextResponse.json({ ticket: data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "complaints", "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { ticketId, ...updates } = body;

    if (!hasAdminClient()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const allowed = ["status", "priority", "assigned_to", "resolution", "internal_notes"];
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (updates[key] !== undefined) patch[key] = updates[key];
    }
    if (updates.status === "resolved") patch.resolved_at = new Date().toISOString();

    const { data, error } = await createAdminClient()
      .from("support_tickets")
      .update(patch)
      .eq("id", ticketId)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction({
      adminId: ctx.admin.id,
      adminEmail: ctx.admin.email,
      action: "update",
      resource: "complaints",
      resourceId: ticketId,
      details: patch,
    });

    return NextResponse.json({ ticket: data });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
