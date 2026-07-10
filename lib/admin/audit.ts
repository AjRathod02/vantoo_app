import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";

export async function logAdminAction(input: {
  adminId?: string;
  adminEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  if (!hasAdminClient()) return;

  try {
    await createAdminClient().from("admin_audit_logs").insert({
      admin_id: input.adminId ?? null,
      admin_email: input.adminEmail ?? null,
      action: input.action,
      resource: input.resource,
      resource_id: input.resourceId ?? null,
      details: input.details ?? {},
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    });
  } catch {
    // non-blocking
  }
}
