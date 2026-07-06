import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { isPlatformEnabled, serviceFetch } from "@/lib/platform/client";
import type { AppNotification } from "@/lib/types";

interface PlatformNotification {
  id: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPlatformEnabled()) {
    return NextResponse.json({ notifications: [] });
  }

  try {
    const items = await serviceFetch<PlatformNotification[]>(
      "notification",
      "/v1/notifications",
      { userId: user.id }
    );
    const notifications: AppNotification[] = items.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      read: n.status === "read",
      createdAt: n.createdAt,
    }));
    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ notifications: [] });
  }
}
