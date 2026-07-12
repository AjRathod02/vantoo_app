import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  const cookieStore = await cookies();
  try {
    const supabase = createClient(cookieStore);
    await supabase.auth.signOut();
  } catch {
    // Still clear legacy cookie even if Supabase sign-out fails.
  }
  cookieStore.delete("vantoo_session");
  return NextResponse.json({ ok: true });
}
