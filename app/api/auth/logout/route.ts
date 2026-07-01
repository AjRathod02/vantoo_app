import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export function POST() {
  cookies().delete("vantoo_session");
  return NextResponse.json({ ok: true });
}
