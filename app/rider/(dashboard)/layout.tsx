import { redirect } from "next/navigation";
import { getRiderContext, isApprovedRider } from "@/lib/server/rider";

export const dynamic = "force-dynamic";

export default async function RiderDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { riderData } = await getRiderContext();
  if (!riderData?.rider) redirect("/rider/onboarding");
  if (!isApprovedRider(riderData)) redirect("/rider/onboarding");
  return children;
}
