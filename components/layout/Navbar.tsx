"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Heart, Search, ShoppingCart, User, Mic } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LocationCityButton } from "@/components/location/LocationCityButton";
import { useCartStore } from "@/lib/stores/cart";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";
import {
  pushRecentSearch,
  readRecentSearches,
  type SearchSuggestion,
} from "@/lib/search/suggestions";

export function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [corrected, setCorrected] = useState<string | undefined>();
  const wrapRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const itemCount = useCartStore((s) => s.totals().itemCount);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const user = useAuthStore((s) => s.user);
  const userKey = user?.id ?? "guest";

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const recent = readRecentSearches(userKey);
    const t = setTimeout(() => {
      const params = new URLSearchParams({ q: query });
      if (recent.length) params.set("recent", recent.join("|"));
      fetch(`/api/search/suggest?${params}`)
        .then((r) => r.json())
        .then((d) => {
          setSuggestions(d.suggestions ?? []);
          setCorrected(d.corrected);
        });
    }, 120);
    return () => clearTimeout(t);
  }, [query, userKey]);

  const goSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    pushRecentSearch(trimmed, userKey);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    goSearch(query);
  };

  const voiceSearch = () => {
    type Rec = {
      start: () => void;
      onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    };
    const w = window as unknown as {
      SpeechRecognition?: new () => Rec;
      webkitSpeechRecognition?: new () => Rec;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      setQuery(text);
      goSearch(text);
    };
    rec.start();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="container-page flex h-14 items-center gap-2 sm:h-16 sm:gap-4">
        <Logo className="shrink-0" />

        <LocationCityButton className="hidden lg:flex" />

        <div ref={wrapRef} className="relative min-w-0 flex-1">
          <form onSubmit={onSearch} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft sm:left-3.5" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search food, groceries..."
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-10 text-sm placeholder:text-ink-soft focus:border-brand-primary focus:bg-white focus:outline-none sm:h-11 sm:pl-10 sm:pr-12"
            />
            <button
              type="button"
              onClick={voiceSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-soft hover:bg-gray-100 hover:text-brand-primary"
              aria-label="Voice search"
            >
              <Mic className="h-4 w-4" />
            </button>
          </form>

          {open && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-2xl border border-gray-100 bg-white py-2 shadow-cardHover">
              {corrected && (
                <button
                  type="button"
                  onClick={() => goSearch(corrected)}
                  className="w-full px-4 py-2 text-left text-sm text-ink-muted hover:bg-gray-50"
                >
                  Did you mean{" "}
                  <span className="font-semibold text-brand-primary">
                    {corrected}
                  </span>
                  ?
                </button>
              )}
              {suggestions.length === 0 ? (
                <p className="px-4 py-3 text-sm text-ink-soft">
                  Start typing to see suggestions
                </p>
              ) : (
                suggestions.map((s, i) => (
                  <button
                    key={`${s.type}-${s.label}-${i}`}
                    type="button"
                    onClick={() => {
                      pushRecentSearch(s.label, userKey);
                      setOpen(false);
                      router.push(s.href);
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50"
                  >
                    <span>
                      <span className="text-sm font-medium text-ink">
                        {s.label}
                      </span>
                      {s.meta && (
                        <span className="ml-2 text-xs text-ink-soft">
                          {s.meta}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-ink-soft">
                      {s.type}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

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
