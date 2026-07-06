import { getSessionUser } from "@/lib/server/auth";
import { isPlatformEnabled } from "@/lib/platform/client";
import { getRiderMe, type RiderMeResponse } from "@/lib/platform/riders";

export async function getRiderContext(): Promise<{
  user: Awaited<ReturnType<typeof getSessionUser>>;
  riderData: RiderMeResponse | null;
}> {
  const user = await getSessionUser();
  if (!user || !isPlatformEnabled()) {
    return { user, riderData: null };
  }
  try {
    const riderData = await getRiderMe(user.id);
    return { user, riderData };
  } catch {
    return { user, riderData: null };
  }
}

export function isApprovedRider(riderData: RiderMeResponse | null): boolean {
  return riderData?.rider?.status === "approved";
}

export function canAccessRiderPortal(riderData: RiderMeResponse | null): boolean {
  if (!riderData?.rider) return true;
  return riderData.rider.status !== "rejected" && riderData.rider.status !== "suspended";
}
