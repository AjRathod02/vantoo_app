import { createClient } from "@/utils/supabase/server";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { cookies } from "next/headers";
import type { User } from "@/lib/types";

type ProfileRow = {
  name: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
};

async function fetchProfile(userId: string, supabase: ReturnType<typeof createClient>) {
  if (hasAdminClient()) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("profiles")
        .select("name, phone, email, role")
        .eq("id", userId)
        .maybeSingle<ProfileRow>();
      if (data) return data;
    } catch {
      // fall through to user-scoped client
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("name, phone, email, role")
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error?.message?.includes("schema cache")) return null;
  return data;
}

export async function getSessionUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const profile = await fetchProfile(user.id, supabase);

    if (!profile) {
      return {
        id: user.id,
        name: (user.user_metadata?.name as string | undefined) || "Vantoo User",
        phone: (user.user_metadata?.phone as string | undefined) || "",
        email: user.email,
        role: "customer",
      };
    }

    return {
      id: user.id,
      name: profile.name || (user.user_metadata?.name as string | undefined) || "Vantoo User",
      phone: profile.phone || (user.user_metadata?.phone as string | undefined) || "",
      email: profile.email || user.email,
      role: profile.role === "admin" ? "admin" : "customer",
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  try {
    const { requireAdminAuth } = await import("@/lib/admin/auth");
    const ctx = await requireAdminAuth();
    return {
      id: ctx.admin.id,
      name: ctx.admin.name,
      phone: ctx.admin.phone ?? "",
      email: ctx.admin.email,
      role: "admin" as const,
      adminRole: ctx.admin.role,
      permissions: ctx.permissions,
      sessionId: ctx.sessionId,
    };
  } catch {
    const user = await requireUser();
    if (user.role !== "admin") throw new Error("Forbidden");
    return user;
  }
}
