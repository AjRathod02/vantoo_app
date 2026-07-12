import { NextResponse } from "next/server";
import { requireAdminAuth, adminErrorResponse } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/rbac";
import {
  adminGetReferralAnalytics,
  adminListReferralTransactions,
  adminUpdateRewardStatus,
  getReferralSettings,
  updateReferralSettings,
} from "@/lib/referral";
import { z } from "zod";

export async function GET() {
  try {
    const ctx = await requireAdminAuth();
    if (!hasPermission(ctx.permissions, "referrals", "read")) {
      // Fallback: allow settings readers during rollout before permissions migrate
      if (!hasPermission(ctx.permissions, "settings", "read")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const [settings, analytics, transactions] = await Promise.all([
      getReferralSettings(),
      adminGetReferralAnalytics(),
      adminListReferralTransactions(),
    ]);

    return NextResponse.json({ settings, analytics, transactions });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const patchSchema = z.object({
  settings: z
    .object({
      isEnabled: z.boolean().optional(),
      minOrderAmount: z.number().min(0).optional(),
      commissionPercent: z.number().min(0).max(100).optional(),
    })
    .optional(),
  reward: z
    .object({
      id: z.string().min(1),
      status: z.enum(["completed", "rejected"]),
      rejectionReason: z.string().optional(),
    })
    .optional(),
});

export async function PATCH(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (
      !hasPermission(ctx.permissions, "referrals", "update") &&
      !hasPermission(ctx.permissions, "settings", "update")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (parsed.data.settings) {
      const settings = await updateReferralSettings(
        parsed.data.settings,
        ctx.admin.id
      );
      return NextResponse.json({ settings });
    }

    if (parsed.data.reward) {
      const result = await adminUpdateRewardStatus(
        parsed.data.reward.id,
        parsed.data.reward.status,
        parsed.data.reward.rejectionReason
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      const transactions = await adminListReferralTransactions();
      return NextResponse.json({ ok: true, transactions });
    }

    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
