import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/utils/supabase/env";
import { applyReferralOnSignup, ensureReferralCode } from "@/lib/referral";

function isLikelyNewUser(user: {
  created_at: string;
  last_sign_in_at?: string | null;
  identities?: { provider: string; created_at?: string }[] | null;
}) {
  const created = new Date(user.created_at).getTime();
  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).getTime()
    : created;
  if (Math.abs(lastSignIn - created) < 60_000) return true;

  const googleIdentity = user.identities?.find((i) => i.provider === "google");
  if (googleIdentity?.created_at) {
    return (
      Math.abs(new Date(googleIdentity.created_at).getTime() - Date.now()) <
      60_000
    );
  }

  return false;
}

function displayName(user: {
  user_metadata?: Record<string, unknown>;
  email?: string;
}) {
  const meta = user.user_metadata ?? {};
  const name =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.given_name === "string" && meta.given_name) ||
    "";
  return name.trim() || user.email?.split("@")[0] || "Vantoo User";
}

/**
 * Supabase OAuth callback.
 * - intent=signup: create/link account, clear session, send user to /login
 * - intent=login (default): keep session and continue into the app
 */
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const intent = searchParams.get("intent") === "signup" ? "signup" : "login";
  const referralCode = searchParams.get("ref") ?? undefined;
  const rawRedirect = searchParams.get("redirect") ?? "/";
  const next = rawRedirect.startsWith("/") ? rawRedirect : "/";

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL("/login?error=oauth", origin));
  }

  const redirectTarget =
    intent === "signup"
      ? new URL("/login", origin)
      : new URL(next, origin);

  let response = NextResponse.redirect(redirectTarget);
  const cookieStore = await cookies();

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=oauth", origin));
  }

  const name = displayName(data.user);
  await ensureReferralCode(data.user.id, name, origin);

  if (intent === "signup") {
    const isNew = isLikelyNewUser(data.user);
    if (isNew && referralCode?.trim()) {
      await applyReferralOnSignup({
        referredUserId: data.user.id,
        referredName: name,
        referralCode,
      });
    }

    // Registration must not leave an active session.
    await supabase.auth.signOut();

    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("registered", isNew ? "google" : "exists");

    const finalResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie);
    });
    return finalResponse;
  }

  return response;
}
