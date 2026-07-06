import { redirect } from "next/navigation";
import { getVendorContext, isApprovedVendor } from "@/lib/server/vendor";

export const dynamic = "force-dynamic";

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { vendorData } = await getVendorContext();
  if (!vendorData?.vendor) redirect("/vendor/onboarding");
  if (!isApprovedVendor(vendorData)) redirect("/vendor/onboarding");
  return children;
}
