import { createClient } from "@/utils/supabase/server";

import { cookies } from "next/headers";

import type { User } from "@/lib/types";



type ProfileRow = {

  name: string | null;

  phone: string | null;

  email: string | null;

  role: string | null;

};



export async function getSessionUser(): Promise<User | null> {

  try {

    const cookieStore = await cookies();

    const supabase = createClient(cookieStore);

    const {

      data: { user },

    } = await supabase.auth.getUser();



    if (!user) return null;



    const { data: profile, error: profileError } = await supabase

      .from("profiles")

      .select("name, phone, email, role")

      .eq("id", user.id)

      .maybeSingle<ProfileRow>();



    if (profileError?.message?.includes("schema cache")) {

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

      name:

        profile?.name ||

        (user.user_metadata?.name as string | undefined) ||

        "Vantoo User",

      phone:

        profile?.phone ||

        (user.user_metadata?.phone as string | undefined) ||

        "",

      email: profile?.email || user.email,

      role: profile?.role === "admin" ? "admin" : "customer",

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

  const user = await requireUser();

  if (user.role !== "admin") throw new Error("Forbidden");

  return user;

}


