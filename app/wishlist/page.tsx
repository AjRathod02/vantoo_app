"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { useHydrated } from "@/lib/useHydrated";
import { ProductGrid } from "@/components/ProductGrid";
import { Button } from "@/components/ui/Button";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const hydrated = useHydrated();

  return (
    <div className="container-page space-y-5 py-6">
      <h1 className="text-2xl font-bold text-ink">My Wishlist</h1>

      {!hydrated ? null : items.length > 0 ? (
        <ProductGrid products={items} />
      ) : (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <Heart className="h-12 w-12 text-ink-soft" />
          <div>
            <p className="font-semibold text-ink">Your wishlist is empty</p>
            <p className="text-sm text-ink-muted">
              Save items you love to find them easily later.
            </p>
          </div>
          <Link href="/">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
