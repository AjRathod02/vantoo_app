import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";

export async function updateCustomerPassword(
  userId: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasAdminClient()) {
    return { ok: false, error: "Authentication service is not configured." };
  }

  const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function markEmailVerified(userId: string) {
  if (!hasAdminClient()) return;
  try {
    await createAdminClient()
      .from("profiles")
      .update({ email_verified: true })
      .eq("id", userId);
    await createAdminClient().auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
  } catch {
    // optional column / profile update
  }
}
