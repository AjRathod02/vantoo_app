import { NextResponse } from "next/server";
import {
  listUserLocations,
  loadLocationsFromDb,
} from "@/lib/server/userLocations";
import { getSessionUser } from "@/lib/server/auth";
import type { LocationRole } from "@/lib/types";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
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
