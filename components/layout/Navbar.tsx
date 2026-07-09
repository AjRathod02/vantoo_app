"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, Search, ShoppingCart, User } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LocationCityButton } from "@/components/location/LocationCityButton";
import { useCartStore } from "@/lib/stores/cart";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";

export function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const hydrated = useHydrated();
  const itemCount = useCartStore((s) => s.totals().itemCount);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const user = useAuthStore((s) => s.user);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="container-page flex h-14 items-center gap-2 sm:h-16 sm:gap-4">
        <Logo className="shrink-0" />

        <LocationCityButton className="hidden lg:flex" />

        <form onSubmit={onSearch} className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft sm:left-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search food, groceries..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm placeholder:text-ink-soft focus:border-brand-primary focus:bg-white focus:outline-none sm:h-11 sm:pl-10 sm:pr-4 sm:placeholder:text-ink-soft"
          />
        </form>

        <nav className="flex items-center gap-1">
          <NavIcon href="/wishlist" label="Wishlist" badge={hydrated ? wishlistCount : 0}>
            <Heart className="h-5 w-5" />
          </NavIcon>
          <NavIcon href="/cart" label="Cart" badge={hydrated ? itemCount : 0}>
            <ShoppingCart className="h-5 w-5" />
          </NavIcon>
          <Link
            href={user ? "/profile" : "/login"}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink hover:bg-gray-50"
          >
            <User className="h-5 w-5" />
            <span className="hidden sm:inline">
              {hydrated && user ? user.name.split(" ")[0] : "Login"}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function NavIcon({
  href,
  label,
  badge,
  children,
}: {
  href: string;
  label: string;
  badge: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative hidden rounded-xl p-2.5 text-ink hover:bg-gray-50 sm:block"
    >
      {children}
      {badge > 0 && (
        <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-primary px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
