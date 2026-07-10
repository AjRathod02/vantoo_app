import { cookies } from "next/headers";
import { ADMIN_ACCESS_COOKIE, ADMIN_REFRESH_COOKIE } from "./jwt";

const isProd = process.env.NODE_ENV === "production";

export async function setAdminCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();
  store.set(ADMIN_ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  store.set(ADMIN_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearAdminCookies() {
  const store = await cookies();
  store.delete(ADMIN_ACCESS_COOKIE);
  store.delete(ADMIN_REFRESH_COOKIE);
}
