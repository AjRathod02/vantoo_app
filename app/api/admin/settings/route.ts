import { NextResponse } from "next/server";
import { requireAdminAuth, adminErrorResponse } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { listAdminUsers } from "@/lib/admin/db";

export async function GET() {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "settings", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings: Record<string, unknown> = {};

    if (hasAdminClient()) {
      const { data: policies } = await createAdminClient()
        .from("cancellation_policies")
        .select("*");
      settings.cancellationPolicies = policies ?? [];
    }

    if (hasPermission(ctx.permissions, "admin_users", "read")) {
      settings.adminUsers = await listAdminUsers();
    }

    return NextResponse.json({ settings });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "settings", "update")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (body.cancellationPolicy && hasAdminClient()) {
      const p = body.cancellationPolicy;
      const { data, error } = await createAdminClient()
        .from("cancellation_policies")
        .update({
          free_cancellation_minutes: p.freeCancellationMinutes,
          cancellation_charge_percent: p.cancellationChargePercent,
          refund_percent: p.refundPercent,
          penalty_amount: p.penaltyAmount,
          updated_by: ctx.admin.id,
          updated_at: new Date().toISOString(),
        })
        .eq("user_type", p.userType)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ policy: data });
    }

    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
