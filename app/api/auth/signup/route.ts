import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import type { User } from "@/lib/types";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
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
      { error: "Fill all required fields. Password must be 6+ characters." },
      { status: 400 }
    );
  }

  const { name, email, phone, password } = parsed.data;
  const origin = new URL(request.url).origin;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  if (hasAdminClient()) {
    const admin = createAdminClient();
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, phone: phone ?? "" },
      });

    if (createError) {
      const message =
        createError.message.includes("already been registered")
          ? "This email is already registered. Try signing in."
          : createError.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { data: signIn, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !signIn.user) {
      return NextResponse.json(
        { error: signInError?.message ?? "Account created but sign-in failed." },
        { status: 400 }
      );
    }

    const profile = await fetchProfile(supabase, signIn.user.id);
    return NextResponse.json(
      { user: mapUser(signIn.user, profile ?? { name, phone, role: "customer" }) },
      { status: 201 }
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone: phone ?? "" },
      emailRedirectTo: `${origin}/login`,
    },
  });

  if (error) {
    const message = error.message.includes("schema cache")
      ? "Database tables are missing. Run the migration in Supabase SQL Editor (see supabase/migrations/001_initial_schema.sql) or POST /api/setup/migrate with DATABASE_URL set."
      : error.message.includes("already been registered") ||
          error.message.includes("already registered")
        ? "This email is already registered. Try signing in."
        : error.message.includes("profiles") || error.message.includes("handle_new_user")
          ? "Database setup incomplete. Run supabase/migrations/001_initial_schema.sql in Supabase SQL Editor."
          : error.message;

    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!data.user) {
    return NextResponse.json({ error: "Signup failed." }, { status: 400 });
  }

  if (!data.session) {
    return NextResponse.json(
      {
        needsEmailConfirmation: true,
        message:
          "Account created! Check your email to confirm, then sign in. Or disable email confirmation in Supabase → Authentication → Providers → Email.",
      },
      { status: 200 }
    );
  }

  const profile = await fetchProfile(supabase, data.user.id);
  return NextResponse.json(
    { user: mapUser(data.user, profile ?? { name, phone, role: "customer" }) },
    { status: 201 }
  );
}
