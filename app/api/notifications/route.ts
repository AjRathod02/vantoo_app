import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth";
import { isPlatformEnabled, serviceFetch } from "@/lib/platform/client";
import { listUserNotifications } from "@/lib/referral";
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

  const local = await listUserNotifications(user.id);

  if (!isPlatformEnabled()) {
    return NextResponse.json({ notifications: local });
  }

  try {
    const items = await serviceFetch<PlatformNotification[]>(
      "notification",
      "/v1/notifications",
      { userId: user.id }
    );
    const platform: AppNotification[] = items.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      read: n.status === "read",
      createdAt: n.createdAt,
    }));

    const merged = [...local, ...platform].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return NextResponse.json({ notifications: merged });
  } catch {
    return NextResponse.json({ notifications: local });
  }
}
