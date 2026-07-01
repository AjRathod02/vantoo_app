import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import type { User } from "@/lib/types";

const loginSchema = z.object({
  phone: z.string().min(8, "Enter a valid phone number"),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid phone" },
      { status: 400 }
    );
  }

  const { phone } = parsed.data;
  const user: User = {
    id: `u-${phone.slice(-4)}`,
    name: "Robin Yoder",
    phone,
    email: "robin.yoder@example.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  };

  cookies().set("vantoo_session", user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ user });
}
