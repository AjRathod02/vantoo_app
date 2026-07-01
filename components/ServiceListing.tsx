"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Product, ServiceType } from "@/lib/types";
import { categories as allCategories } from "@/lib/data/categories";
import { api } from "@/lib/api";
import { Chip } from "@/components/ui/Chip";
import { ProductGrid, ProductGridSkeleton } from "@/components/ProductGrid";

export function ServiceListing({
  service,
  title,
  subtitle,
}: {
  service: ServiceType;
  title: string;
  subtitle: string;
}) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");
  const [category, setCategory] = useState<string | null>(initialCategory);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = allCategories.filter((c) => c.service === service);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .products({ service, category: category ?? undefined })
      .then((data) => {
        if (active) setProducts(data.products);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [service, category]);

  return (
    <div className="container-page space-y-5 py-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="text-sm text-ink-muted">{subtitle}</p>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <Chip active={!category} onClick={() => setCategory(null)}>
          All
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.id}
            active={category === c.name}
            onClick={() => setCategory(c.name)}
          >
            {c.name}
          </Chip>
        ))}
      </div>

      {loading ? (
        <ProductGridSkeleton />
      ) : products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <p className="py-16 text-center text-ink-muted">
          No products found in this category.
        </p>
      )}
    </div>
  );
}
