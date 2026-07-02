"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/stores/cart";
import { useHydrated } from "@/lib/useHydrated";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/cart", label: "Cart", icon: ShoppingCart, isCart: true },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const itemCount = useCartStore((s) => s.totals().itemCount);

  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white sm:hidden">
      <div className="grid grid-cols-5 items-end px-2 pb-1 pt-2">
        {links.map(({ href, label, icon: Icon, isCart }) => {
          const active = pathname === href;
          if (isCart) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center"
                aria-label={label}
              >
                <span className="relative -mt-6 grid h-12 w-12 place-items-center rounded-full bg-brand-primary text-white shadow-cardHover">
                  <Icon className="h-5 w-5" />
                  {hydrated && itemCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-secondary px-1 text-[10px] font-bold text-white">
                      {itemCount}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 text-[10px] font-medium text-ink-muted">
                  {label}
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 text-[10px] font-medium",
                active ? "text-brand-primary" : "text-ink-soft"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
