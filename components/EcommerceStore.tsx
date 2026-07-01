"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { products as allProducts } from "@/lib/data/products";
import { categories as allCategories } from "@/lib/data/categories";
import { api } from "@/lib/api";
import { ProductGrid, ProductGridSkeleton } from "@/components/ProductGrid";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const PRICE_MAX = 5000;

export function EcommerceStore() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState<string | null>(
    searchParams.get("category")
  );
  const [brands, setBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = allCategories.filter((c) => c.service === "ecommerce");
  const brandOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allProducts.filter((p) => p.service === "ecommerce").map((p) => p.brand)
        )
      ).sort(),
    []
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .products({
        service: "ecommerce",
        category: category ?? undefined,
        brands,
        maxPrice: maxPrice < PRICE_MAX ? maxPrice : undefined,
        minRating: minRating || undefined,
        sort: sort || undefined,
      })
      .then((data) => active && setProducts(data.products))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [category, brands, maxPrice, minRating, sort]);

  const toggleBrand = (brand: string) =>
    setBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );

  const reset = () => {
    setCategory(null);
    setBrands([]);
    setMaxPrice(PRICE_MAX);
    setMinRating(0);
  };

  const sidebar = (
    <div className="space-y-6">
      <FilterSection title="Categories">
        <button
          onClick={() => setCategory(null)}
          className={cn(
            "block w-full rounded-lg px-3 py-1.5 text-left text-sm",
            !category ? "bg-brand-surface font-semibold text-brand-primary" : "text-ink-muted hover:bg-gray-50"
          )}
        >
          All Categories
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.name)}
            className={cn(
              "block w-full rounded-lg px-3 py-1.5 text-left text-sm",
              category === c.name
                ? "bg-brand-surface font-semibold text-brand-primary"
                : "text-ink-muted hover:bg-gray-50"
            )}
          >
            {c.name}
          </button>
        ))}
      </FilterSection>

      <FilterSection title="Price Range">
        <input
          type="range"
          min={500}
          max={PRICE_MAX}
          step={100}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-brand-primary"
        />
        <p className="text-sm text-ink-muted">
          Up to <span className="font-semibold text-ink">₹{maxPrice}</span>
        </p>
      </FilterSection>

      <FilterSection title="Brands">
        {brandOptions.map((brand) => (
          <label
            key={brand}
            className="flex cursor-pointer items-center gap-2 py-1 text-sm text-ink-muted"
          >
            <input
              type="checkbox"
              checked={brands.includes(brand)}
              onChange={() => toggleBrand(brand)}
              className="h-4 w-4 rounded accent-brand-primary"
            />
            {brand}
          </label>
        ))}
      </FilterSection>

      <FilterSection title="Rating">
        {[4, 3, 2].map((r) => (
          <label
            key={r}
            className="flex cursor-pointer items-center gap-2 py-1 text-sm text-ink-muted"
          >
            <input
              type="radio"
              name="rating"
              checked={minRating === r}
              onChange={() => setMinRating(r)}
              className="h-4 w-4 accent-brand-primary"
            />
            {r}★ & above
          </label>
        ))}
      </FilterSection>

      <Button variant="outline" fullWidth onClick={reset}>
        Reset Filters
      </Button>
    </div>
  );

  return (
    <div className="container-page py-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">E-commerce Store</h1>
          <p className="text-sm text-ink-muted">
            {loading ? "Loading..." : `${products.length} products`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-32 rounded-2xl border border-gray-100 p-4 shadow-card">
            {sidebar}
          </div>
        </aside>

        <div className="flex-1">
          {loading ? (
            <ProductGridSkeleton />
          ) : products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <p className="py-16 text-center text-ink-muted">
              No products match your filters.
            </p>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
            <Button
              fullWidth
              className="mt-4"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Show {products.length} results
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold text-ink">{title}</h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
