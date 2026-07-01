"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";
import { Rating } from "@/components/ui/Rating";
import { useCartStore } from "@/lib/stores/cart";
import { useWishlistStore } from "@/lib/stores/wishlist";
import { useHydrated } from "@/lib/useHydrated";
import { toast } from "@/lib/stores/toast";

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useWishlistStore((s) => s.items.some((i) => i.id === product.id));
  const hydrated = useHydrated();

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-shadow hover:shadow-cardHover">
      <Link href={`/product/${product.id}`} className="relative block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-lg bg-brand-secondary px-2 py-0.5 text-xs font-bold text-white">
            {discount}% OFF
          </span>
        )}
      </Link>

      <button
        aria-label="Toggle wishlist"
        onClick={() => {
          toggleWishlist(product);
          toast.success(
            wishlisted ? "Removed from wishlist" : "Added to wishlist"
          );
        }}
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm"
      >
        <Heart
          className={cn(
            "h-4 w-4",
            hydrated && wishlisted
              ? "fill-brand-secondary text-brand-secondary"
              : "text-ink-muted"
          )}
        />
      </button>

      <div className="flex flex-1 flex-col p-3">
        <Link href={`/product/${product.id}`}>
          <h3 className="line-clamp-1 text-sm font-semibold text-ink">
            {product.name}
          </h3>
        </Link>
        <p className="mb-1 line-clamp-1 text-xs text-ink-soft">
          {product.brand}
          {product.unit ? ` · ${product.unit}` : ""}
        </p>
        <Rating value={product.rating} reviews={product.reviews} className="mb-2" />
        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-ink">
              {formatINR(product.price)}
            </span>
            {product.originalPrice && (
              <span className="ml-1.5 text-xs text-ink-soft line-through">
                {formatINR(product.originalPrice)}
              </span>
            )}
          </div>
          <button
            aria-label="Add to cart"
            onClick={() => {
              addItem(product);
              toast.success(`${product.name} added to cart`);
            }}
            className="grid h-8 w-8 place-items-center rounded-lg bg-brand-primary text-white transition-colors hover:bg-brand-primaryDark"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
