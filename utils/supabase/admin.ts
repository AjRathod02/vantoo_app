import {
  createAdminClient as createSupabaseAdminClient,
  resolveEnv,
} from "@supabase/server/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveNextEnv } from "@/lib/supabase/env";

export function createAdminClient(): SupabaseClient {
  const { data: env, error } = resolveEnv(resolveNextEnv());
  if (error) {
    throw new Error(
      "Missing Supabase config for admin operations (SUPABASE_URL and SUPABASE_SECRET_KEY)"
    );
  }
  return createSupabaseAdminClient({ env });
}

export function hasAdminClient() {
  const nextEnv = resolveNextEnv();
  return Boolean(nextEnv.url && nextEnv.secretKeys?.default);
}
