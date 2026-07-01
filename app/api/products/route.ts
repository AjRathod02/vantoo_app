import { NextResponse } from "next/server";
import { products } from "@/lib/data/products";
import type { Product } from "@/lib/types";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service");
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase();
  const brands = searchParams.get("brands")?.split(",").filter(Boolean);
  const minPrice = Number(searchParams.get("minPrice")) || 0;
  const maxPrice = Number(searchParams.get("maxPrice")) || Infinity;
  const minRating = Number(searchParams.get("minRating")) || 0;
  const sort = searchParams.get("sort");

  let result: Product[] = products.filter((p) => {
    if (service && p.service !== service) return false;
    if (category && p.category !== category) return false;
    if (brands && brands.length > 0 && !brands.includes(p.brand)) return false;
    if (p.price < minPrice || p.price > maxPrice) return false;
    if (p.rating < minRating) return false;
    if (q) {
      const haystack =
        `${p.name} ${p.brand} ${p.category} ${p.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  if (sort === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
  else if (sort === "rating") result = [...result].sort((a, b) => b.rating - a.rating);

  return NextResponse.json({ products: result, count: result.length });
}
