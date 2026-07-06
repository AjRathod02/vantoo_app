import { getSessionUser } from "@/lib/server/auth";
import { isPlatformEnabled } from "@/lib/platform/client";
import { getVendorMe, type VendorMeResponse } from "@/lib/platform/vendors";

export async function getVendorContext(): Promise<{
  user: Awaited<ReturnType<typeof getSessionUser>>;
  vendorData: VendorMeResponse | null;
}> {
  const user = await getSessionUser();
  if (!user || !isPlatformEnabled()) {
    return { user, vendorData: null };
  }
  try {
    const vendorData = await getVendorMe(user.id);
    return { user, vendorData };
  } catch {
    return { user, vendorData: null };
  }
}

export function isApprovedVendor(vendorData: VendorMeResponse | null): boolean {
  return vendorData?.vendor?.status === "approved";
}

export function canAccessVendorPortal(vendorData: VendorMeResponse | null): boolean {
  if (!vendorData?.vendor) return true; // allow onboarding
  return vendorData.vendor.status !== "rejected" && vendorData.vendor.status !== "suspended";
}
