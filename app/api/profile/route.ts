import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  if (!hasAdminClient()) {
    return NextResponse.json({
      profile: { ...user, dateOfBirth: null, dobChangeCount: 0 },
    });
  }
  const { data } = await createAdminClient()
    .from("profiles")
    .select("name, phone, email, role, date_of_birth, dob_change_count, dob_updated_at")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    profile: {
      id: user.id,
      name: data?.name || user.name,
      phone: data?.phone || user.phone,
      email: data?.email || user.email,
      role: user.role,
      dateOfBirth: data?.date_of_birth ?? null,
      dobChangeCount: data?.dob_change_count ?? 0,
      dobUpdatedAt: data?.dob_updated_at ?? null,
    },
  });
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid profile" }, { status: 400 });
  }

  if (!hasAdminClient()) {
    return NextResponse.json({
      profile: {
        ...user,
        name: parsed.data.name ?? user.name,
        phone: parsed.data.phone ?? user.phone,
        dateOfBirth: parsed.data.dateOfBirth ?? null,
      },
    });
  }

  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from("profiles")
    .select("date_of_birth, dob_change_count")
    .eq("id", user.id)
    .maybeSingle();

  const updates: Record<string, unknown> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.phone != null) updates.phone = parsed.data.phone;

  if (parsed.data.dateOfBirth) {
    const changeCount = Number(current?.dob_change_count ?? 0);
    if (current?.date_of_birth && changeCount >= 2) {
      return NextResponse.json(
        {
          error:
            "Date of birth can only be changed twice. Contact support for further updates.",
        },
        { status: 400 }
      );
    }
    updates.date_of_birth = parsed.data.dateOfBirth;
    updates.dob_updated_at = new Date().toISOString();
    updates.dob_change_count = current?.date_of_birth
      ? changeCount + 1
      : changeCount;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("name, phone, email, role, date_of_birth, dob_change_count")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    profile: {
      id: user.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      role: data.role,
      dateOfBirth: data.date_of_birth,
      dobChangeCount: data.dob_change_count,
    },
  });
}
