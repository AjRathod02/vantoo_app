import { NextResponse } from "next/server";
import { listProducts } from "@/lib/server/products";
import type { Product } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const brands = searchParams.get("brands")?.split(",").filter(Boolean);
  const minPrice = Number(searchParams.get("minPrice")) || 0;
  const maxPrice = Number(searchParams.get("maxPrice")) || Infinity;
  const minRating = Number(searchParams.get("minRating")) || 0;
  const sort = searchParams.get("sort");

  let result: Product[] = await listProducts({ service, category, q });

  if (brands && brands.length > 0) {
    result = result.filter((p) => brands.includes(p.brand));
  }
  result = result.filter(
    (p) => p.price >= minPrice && p.price <= maxPrice && p.rating >= minRating
  );

  if (sort === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
  else if (sort === "rating") result = [...result].sort((a, b) => b.rating - a.rating);

  return NextResponse.json({ products: result, count: result.length });
}
