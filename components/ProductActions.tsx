"use client";

import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { useCartStore } from "@/lib/stores/cart";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { useHydrated } from "@/lib/useHydrated";
import { toast } from "@/lib/stores/toast";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";

export function ProductActions({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useWishlistStore((s) =>
    s.items.some((i) => i.id === product.id)
  );
  const hydrated = useHydrated();

  return (
    <div className="flex flex-col gap-4">
      <AvailabilityBadge inStock={product.inStock} size="md" />

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-ink-muted">Quantity</span>
        <QuantityStepper value={qty} onChange={(n) => setQty(Math.max(1, n))} />
      </div>

      <div className="flex gap-3">
        <Button
          size="lg"
          className="flex-1"
          disabled={!product.inStock}
          onClick={() => {
            if (!product.inStock) {
              toast.error(`${product.name} is currently out of stock`);
              return;
            }
            addItem(product, qty);
          }}
        >
          <ShoppingCart className="h-5 w-5" />
          {product.inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          aria-label="Toggle wishlist"
          onClick={() => {
            toggleWishlist(product);
            toast.success(
              wishlisted ? "Removed from wishlist" : "Added to wishlist"
            );
          }}
        >
          <Heart
            className={cn(
              "h-5 w-5",
              hydrated && wishlisted &&
                "fill-brand-secondary text-brand-secondary"
            )}
          />
        </Button>
      </div>
    </div>
  );
}
