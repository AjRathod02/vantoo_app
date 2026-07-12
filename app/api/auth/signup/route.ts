import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { isSupabaseConfigured } from "@/utils/supabase/env";
import { applyReferralOnSignup, ensureReferralCode } from "@/lib/referral";

const SUCCESS_MESSAGE =
  "Account created successfully. Please log in to continue.";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  referralCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

async function afterSignup(
  userId: string,
  displayName: string,
  options: {
    referralCode?: string;
    dateOfBirth?: string;
    origin: string;
    email?: string;
  }
) {
  await ensureReferralCode(userId, displayName, options.origin);
  if (options.referralCode?.trim()) {
    await applyReferralOnSignup({
      referredUserId: userId,
      referredName: displayName,
      referralCode: options.referralCode,
    });
  }
  if (options.dateOfBirth && hasAdminClient()) {
    try {
      await createAdminClient()
        .from("profiles")
        .update({
          date_of_birth: options.dateOfBirth,
          dob_updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    } catch (e) {
      console.error("save DOB:", e);
    }
  }
  if (options.email) {
    try {
      const { sendWelcomeEmail } = await import("@/lib/email");
      const sent = await sendWelcomeEmail({
        to: options.email,
        customerName: displayName,
        origin: options.origin,
      });
      if (!sent.ok) {
        console.error("[Signup] welcome email failed:", sent.error);
      }
    } catch (e) {
      console.error("[Signup] welcome email error:", e);
    }
  }
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

  const { name, email, phone, password, referralCode, dateOfBirth } =
    parsed.data;
  const origin = new URL(request.url).origin;
  const signupMeta = {
    referralCode,
    dateOfBirth,
    origin,
    email,
  };

  // Preferred path: admin createUser never establishes a browser session.
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
      const message = createError.message.includes("already been registered")
        ? "This email is already registered. Try signing in."
        : createError.message;
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (!created.user) {
      return NextResponse.json({ error: "Signup failed." }, { status: 400 });
    }

    await afterSignup(created.user.id, name, signupMeta);
    return NextResponse.json(
      { registered: true, message: SUCCESS_MESSAGE },
      { status: 201 }
    );
  }

  // Fallback: public signUp. If Supabase returns a session, clear it immediately.
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

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
        : error.message.includes("profiles") ||
            error.message.includes("handle_new_user")
          ? "Database setup incomplete. Run supabase/migrations/001_initial_schema.sql in Supabase SQL Editor."
          : error.message;

    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!data.user) {
    return NextResponse.json({ error: "Signup failed." }, { status: 400 });
  }

  if (data.session) {
    await supabase.auth.signOut();
  }

  await afterSignup(data.user.id, name, signupMeta);

  if (!data.session) {
    return NextResponse.json(
      {
        registered: true,
        needsEmailConfirmation: true,
        message:
          "Account created! Check your email to confirm, then sign in.",
      },
      { status: 201 }
    );
  }

  return NextResponse.json(
    { registered: true, message: SUCCESS_MESSAGE },
    { status: 201 }
  );
}
