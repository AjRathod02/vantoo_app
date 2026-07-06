import Link from "next/link";
import { redirect } from "next/navigation";
import { getVendorContext, canAccessVendorPortal, isApprovedVendor } from "@/lib/server/vendor";
import { Logo } from "@/components/Logo";

const approvedLinks = [
  { href: "/vendor", label: "Dashboard" },
  { href: "/vendor/orders", label: "Orders" },
  { href: "/vendor/products", label: "Products" },
  { href: "/vendor/stores", label: "Stores" },
  { href: "/vendor/settings", label: "Settings" },
];

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user, vendorData } = await getVendorContext();
  if (!user) redirect("/login?redirect=/vendor");

  if (vendorData && !canAccessVendorPortal(vendorData)) {
    redirect("/");
  }

  const approved = isApprovedVendor(vendorData);
  const hasVendor = Boolean(vendorData?.vendor);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo />
            <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-semibold text-brand-primary">
              Vendor Portal
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
            {hasVendor && !approved && (
              <Link href="/vendor/onboarding" className="text-sm font-medium text-brand-primary">
                Onboarding
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            {vendorData?.vendor && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  approved ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                }`}
              >
                {vendorData.vendor.status.replace("_", " ")}
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
