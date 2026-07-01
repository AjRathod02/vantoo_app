import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export function GET() {
  const session = cookies().get("vantoo_session");
  if (!session) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ authenticated: true, userId: session.value });
}
