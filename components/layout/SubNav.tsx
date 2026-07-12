"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UtensilsCrossed,
  ShoppingBasket,
  Pill,
  Store,
  Package,
  Wallet,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/food", label: "Food", icon: UtensilsCrossed },
  { href: "/grocery", label: "Grocery", icon: ShoppingBasket },
  { href: "/medicine", label: "Medicine", icon: Pill },
  { href: "/ecommerce", label: "E-commerce", icon: Store },
  { href: "/orders", label: "My Orders", icon: Package },
  { href: "/refer", label: "Refer", icon: Gift },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

export function SubNav() {
  const pathname = usePathname();
  return (
    <div className="border-b border-gray-100 bg-white">
      <nav className="container-page no-scrollbar flex items-center gap-1 overflow-x-auto py-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-surface text-brand-primary"
                  : "text-ink-muted hover:bg-gray-50 hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
