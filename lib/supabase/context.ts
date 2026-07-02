import { createServerClient } from "@supabase/ssr";
import {
  verifyCredentials,
  createContextClient,
  createAdminClient,
  extractCredentials,
  resolveEnv,
} from "@supabase/server/core";
import type {
  AuthModeWithKey,
  SupabaseContext,
  WithSupabaseConfig,
} from "@supabase/server";
import { cookies } from "next/headers";
import { resolveNextEnv } from "@/lib/supabase/env";

async function getSessionTokenFromCookies(): Promise<string | null> {
  const nextEnv = resolveNextEnv();
  if (!nextEnv.url || !nextEnv.publishableKeys?.default) return null;

  const cookieStore = await cookies();
  const ssrClient = createServerClient(
    nextEnv.url,
    nextEnv.publishableKeys.default,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components can't write cookies — middleware handles refresh.
          }
        },
      },
    }
  );

  const {
    data: { session },
  } = await ssrClient.auth.getSession();
  return session?.access_token ?? null;
}

function authModesIncludeUser(
  auth: AuthModeWithKey | AuthModeWithKey[] | undefined
): boolean {
  const modes = auth ?? "user";
  return Array.isArray(modes) ? modes.includes("user") : modes === "user";
}

async function resolveCredentials(
  request: Request | undefined,
  auth: AuthModeWithKey | AuthModeWithKey[] | undefined
): Promise<{ token: string | null; apikey: string | null }> {
  const headerCreds = request ? extractCredentials(request) : { token: null, apikey: null };

  if (headerCreds.token || headerCreds.apikey || !authModesIncludeUser(auth)) {
    return headerCreds;
  }

  const cookieToken = await getSessionTokenFromCookies();
  return { ...headerCreds, token: cookieToken };
}

/**
 * Creates a {@link SupabaseContext} for Next.js Server Components and server
 * utilities. Reads the session from cookies (refreshed by middleware).
 */
export async function createSupabaseContext(
  options: Pick<WithSupabaseConfig, "auth" | "env"> = { auth: "user" }
): Promise<
  { data: SupabaseContext; error: null } | { data: null; error: Error }
> {
  return createSupabaseContextForRequest(undefined, options);
}

/**
 * Creates a {@link SupabaseContext} from an incoming request. Checks
 * `Authorization` / `apikey` headers first, then falls back to session cookies.
 */
export async function createSupabaseContextForRequest(
  request: Request | undefined,
  options: Pick<WithSupabaseConfig, "auth" | "env"> = { auth: "user" }
): Promise<
  { data: SupabaseContext; error: null } | { data: null; error: Error }
> {
  const { auth = "user", env: envOverrides } = options;

  const { data: env, error: envError } = resolveEnv({
    ...resolveNextEnv(),
    ...envOverrides,
  });

  if (envError) {
    return { data: null, error: envError };
  }

  const credentials = await resolveCredentials(request, auth);

  const { data: authResult, error } = await verifyCredentials(credentials, {
    auth,
    env,
  });

  if (error) {
    return { data: null, error };
  }

  const supabase = createContextClient({
    auth: { token: authResult!.token, keyName: authResult!.keyName },
    env,
  });
  const supabaseAdmin = createAdminClient({ env });

  return {
    data: {
      supabase,
      supabaseAdmin,
      userClaims: authResult!.userClaims,
      jwtClaims: authResult!.jwtClaims,
      authMode: authResult!.authMode,
      authKeyName: authResult!.keyName ?? undefined,
    } as SupabaseContext,
    error: null,
  };
}
