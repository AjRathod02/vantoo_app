import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import type { User } from "@/lib/types";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function mapUser(
  authUser: { id: string; email?: string; user_metadata?: Record<string, string> },
  profile?: { name?: string; phone?: string; role?: string } | null
): User {
  return {
    id: authUser.id,
    name: profile?.name || authUser.user_metadata?.name || "Vantoo User",
    phone: profile?.phone || authUser.user_metadata?.phone || "",
    email: authUser.email,
    role: profile?.role === "admin" ? "admin" : "customer",
  };
}

async function fetchProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("name, phone, role")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured. Check your .env.local file." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email and password (min 6 characters)." },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const message =
      error.message === "Invalid login credentials"
        ? "Invalid email or password. If you just signed up, confirm your email first."
        : error.message === "Email not confirmed"
          ? "Please confirm your email before signing in. Check your inbox."
          : error.message;

    return NextResponse.json({ error: message }, { status: 400 });
  }

  const profile = await fetchProfile(supabase, data.user.id);
  return NextResponse.json({ user: mapUser(data.user, profile) });
}
