import { NextResponse } from "next/server";
import {
  listUserLocations,
  loadLocationsFromDb,
} from "@/lib/server/userLocations";
import { requireAdminAuth } from "@/lib/admin/auth";
import { canRead } from "@/lib/admin/rbac";
import type { LocationRole } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const ctx = await requireAdminAuth();
    if (!canRead(ctx.permissions, "tracking")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await loadLocationsFromDb();

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") as LocationRole | null;
  const city = searchParams.get("city");
  const online = searchParams.get("online");
  const orderId = searchParams.get("orderId");

  const locations = listUserLocations({
    role: role ?? undefined,
    city: city ?? undefined,
    orderId: orderId ?? undefined,
    online:
      online === "true" ? true : online === "false" ? false : undefined,
  });

  return NextResponse.json({ locations });
}
