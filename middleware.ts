import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/checkout", "/orders", "/profile", "/wallet"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isProtected && !request.cookies.get("vantoo_session")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/checkout/:path*", "/orders/:path*", "/profile/:path*", "/wallet/:path*"],
};
