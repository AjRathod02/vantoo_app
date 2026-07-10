import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/utils/supabase/middleware";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/utils/supabase/env";
import { verifyAccessToken, ADMIN_ACCESS_COOKIE, ADMIN_REFRESH_COOKIE } from "@/lib/admin/jwt";

const PROTECTED = ["/checkout", "/order", "/orders", "/profile", "/wallet", "/vendor", "/rider"];
const ADMIN_PREFIX = "/admin";
const ADMIN_PUBLIC = ["/admin/login"];

async function getProfileRole(
  request: NextRequest,
  response: NextResponse,
  userId: string
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle<{ role: string | null }>();

    return data?.role ?? null;
  } catch {
    return null;
  }
}


export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith(ADMIN_PREFIX)) {
    const isPublicAdmin = ADMIN_PUBLIC.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );

    if (!isPublicAdmin) {
      const accessToken = request.cookies.get(ADMIN_ACCESS_COOKIE)?.value;
      let hasDedicatedAdmin = false;

      if (accessToken) {
        const payload = await verifyAccessToken(accessToken);
        hasDedicatedAdmin = Boolean(payload);
      }

      if (!hasDedicatedAdmin) {
        hasDedicatedAdmin = Boolean(request.cookies.get(ADMIN_REFRESH_COOKIE)?.value);
      }

      if (!hasDedicatedAdmin) {
        if (!user) {
          const loginUrl = new URL("/admin/login", request.url);
          loginUrl.searchParams.set("redirect", pathname);
          return NextResponse.redirect(loginUrl);
        }

        const role = await getProfileRole(request, supabaseResponse, user.id);
        if (role !== "admin") {
          return NextResponse.redirect(new URL("/admin/login", request.url));
        }
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
