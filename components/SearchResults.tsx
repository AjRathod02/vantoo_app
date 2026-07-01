"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { Product } from "@/lib/types";
import { api } from "@/lib/api";
import { ProductGrid, ProductGridSkeleton } from "@/components/ProductGrid";

export function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .products({ q })
      .then((data) => active && setProducts(data.products))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [q]);

  return (
    <div className="container-page space-y-5 py-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">
          Search results for &ldquo;{q}&rdquo;
        </h1>
        <p className="text-sm text-ink-muted">
          {loading ? "Searching..." : `${products.length} items found`}
        </p>
      </div>

      {loading ? (
        <ProductGridSkeleton />
      ) : products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Search className="h-10 w-10 text-ink-soft" />
          <p className="text-ink-muted">
            We couldn&apos;t find anything matching your search.
          </p>
        </div>
      )}
    </div>
  );
}
