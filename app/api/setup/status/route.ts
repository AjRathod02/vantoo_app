import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/utils/supabase/env";
import { hasAdminClient } from "@/utils/supabase/admin";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { isDatabaseConfigured } from "@/lib/server/setup-db";

export async function GET() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const checks: Record<string, boolean | string> = {
    supabaseConfigured: Boolean(url && key),
    adminClient: hasAdminClient(),
    razorpayConfigured: isRazorpayConfigured(),
    databaseUrlSet: isDatabaseConfigured(),
  };

  if (url && key) {
    const supabase = createClient(url, key);
    const { error } = await supabase.from("profiles").select("id").limit(1);
    checks.profilesTable =
      !error || !error.message.includes("schema cache");
    if (error?.message.includes("schema cache")) {
      checks.migrationHint =
        "Run supabase/migrations/001_initial_schema.sql in Supabase SQL Editor";
    }
  }

  return NextResponse.json(checks);
}
