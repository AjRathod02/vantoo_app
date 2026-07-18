"use client";

import { usePathname } from "next/navigation";
import { isPortalRoute } from "@/lib/portal-routes";
import { cn } from "@/lib/utils";
import { isCartSummaryHidden } from "@/lib/cart-routes";
import { selectHasCartItems, useCartStore } from "@/lib/stores/cart";
import { useHydrated } from "@/lib/useHydrated";
import { useIsStandaloneApp } from "@/lib/hooks/useIsStandaloneApp";
import { Navbar } from "@/components/layout/Navbar";
import { LocationCityButton } from "@/components/location/LocationCityButton";
import { SubNav } from "@/components/layout/SubNav";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { FloatingCartBar } from "@/components/layout/FloatingCartBar";
import { InstallPrompt } from "@/components/InstallPrompt";

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const isStandaloneApp = useIsStandaloneApp();
  const hasItems = useCartStore(selectHasCartItems);
  const portal = isPortalRoute(pathname);

  const showCartBar =
    hydrated && hasItems && !isCartSummaryHidden(pathname);

  // Website: footer only on Home. Installed PWA / mobile app: never show footer.
  const showFooter = !isStandaloneApp && pathname === "/";

  if (portal) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <div className="border-b border-gray-100 bg-white px-4 py-2 lg:hidden">
        <LocationCityButton />
      </div>
      <SubNav />
      <main
        className={cn(
          "flex-1 sm:pb-0",
          showCartBar ? "pb-36" : "pb-20"
        )}
      >
        {children}
      </main>
      {showFooter ? <Footer /> : null}
      <FloatingCartBar />
      <MobileNav />
      <InstallPrompt />
    </>
  );
}
