import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ user: null });
  }
  return Response.json({ user });
}
