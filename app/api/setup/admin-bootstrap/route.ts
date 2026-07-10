import { NextResponse } from "next/server";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { hashPassword } from "@/lib/admin/crypto";

const DEFAULT_EMAIL = "admin@vantoo.com";
const DEFAULT_PASSWORD = "Admin@Vantoo2024!";

export async function POST(request: Request) {
  const secret = request.headers.get("x-seed-secret");
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!hasAdminClient()) {
    return NextResponse.json(
      { error: "SUPABASE_SECRET_KEY is not configured." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const email = (body.email as string | undefined)?.toLowerCase() ?? DEFAULT_EMAIL;
  const password = (body.password as string | undefined) ?? DEFAULT_PASSWORD;
  const name = (body.name as string | undefined) ?? "Super Admin";

  const db = createAdminClient();

  const { error: tableError } = await db.from("admin_users").select("id").limit(1);
  if (tableError?.message?.includes("schema cache") || tableError?.code === "42P01") {
    return NextResponse.json(
      {
        error: "admin_users table not found.",
        fix:
          "Open Supabase → SQL Editor → run supabase/migrations/003_admin_portal.sql, then call this endpoint again.",
      },
      { status: 503 }
    );
  }

  const existing = await db.from("admin_users").select("id, email").eq("email", email).maybeSingle();
  if (existing.data) {
    return NextResponse.json({
      ok: true,
      message: "Admin already exists",
      email,
      loginUrl: "/admin/login",
    });
  }

  const passwordHash = await hashPassword(password);
  const { data, error } = await db
    .from("admin_users")
    .insert({
      email,
      password_hash: passwordHash,
      name,
      role: "super_admin",
      status: "active",
    })
    .select("id, email, name, role")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Super admin created",
    admin: data,
    credentials: { email, password },
    loginUrl: "/admin/login",
  });
}
