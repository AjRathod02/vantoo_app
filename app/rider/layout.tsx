import Link from "next/link";
import { redirect } from "next/navigation";
import { getRiderContext, canAccessRiderPortal, isApprovedRider } from "@/lib/server/rider";
import { Logo } from "@/components/Logo";

const approvedLinks = [
  { href: "/rider", label: "Dashboard" },
  { href: "/rider/deliveries", label: "Deliveries" },
  { href: "/rider/earnings", label: "Earnings" },
  { href: "/rider/settings", label: "Settings" },
];

export default async function RiderLayout({ children }: { children: React.ReactNode }) {
  const { user, riderData } = await getRiderContext();
  if (!user) redirect("/login?redirect=/rider");

  if (riderData && !canAccessRiderPortal(riderData)) {
    redirect("/");
  }

  const approved = isApprovedRider(riderData);
  const hasRider = Boolean(riderData?.rider);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo />
            <span className="rounded-full bg-brand-secondary/10 px-2 py-0.5 text-xs font-semibold text-brand-secondary">
              Rider Portal
            </span>
            {approved && (
              <nav className="hidden gap-4 md:flex">
                {approvedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-ink-muted hover:text-brand-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
            {hasRider && !approved && (
              <Link href="/rider/onboarding" className="text-sm font-medium text-brand-primary">
                Onboarding
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {riderData?.rider && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  approved ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                }`}
              >
                {riderData.rider.status.replace("_", " ")}
              </span>
            )}
            {approved && riderData?.availability && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  riderData.availability.status === "online"
                    ? "bg-green-100 text-green-700"
                    : riderData.availability.status === "busy"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {riderData.availability.status}
              </span>
            )}
            <span className="hidden text-sm text-ink-muted sm:inline">{user.email}</span>
            <Link
              href="/"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-ink hover:border-brand-primary"
            >
              Storefront
            </Link>
          </div>
        </div>
      </header>
      <div className="container-page py-8">{children}</div>
    </div>
  );
}
