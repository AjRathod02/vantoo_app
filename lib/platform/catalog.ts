import type { Product } from "@/lib/types";
import { isPlatformEnabled, serviceFetch } from "./client";

interface CatalogProduct {
  id: string;
  legacyId: string | null;
  name: string;
  description: string;
  serviceType: Product["service"];
  categoryName: string | null;
  brandName: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  rating: number;
  reviewCount: number;
  image: string | null;
  unit: string | null;
  inStock: boolean;
  vendorId: string;
  variantId: string | null;
}

function toProduct(p: CatalogProduct): Product {
  return {
    id: p.legacyId ?? p.id,
    platformId: p.id,
    variantId: p.variantId ?? undefined,
    name: p.name,
    description: p.description,
    service: p.serviceType,
    category: p.categoryName ?? "",
    brand: p.brandName ?? "",
    price: p.basePrice,
    originalPrice: p.compareAtPrice ?? undefined,
    rating: p.rating,
    reviews: p.reviewCount,
    image: p.image ?? "",
    vendorId: p.vendorId,
    unit: p.unit ?? undefined,
    inStock: p.inStock,
  };
}

export async function listCatalogProducts(filters?: {
  service?: string;
  category?: string;
  q?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: string;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters?.service) params.set("service", filters.service);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.q) params.set("q", filters.q);
  if (filters?.brands?.length) params.set("brands", filters.brands.join(","));
  if (filters?.minPrice) params.set("minPrice", String(filters.minPrice));
  if (filters?.maxPrice && filters.maxPrice !== Infinity) params.set("maxPrice", String(filters.maxPrice));
  if (filters?.minRating) params.set("minRating", String(filters.minRating));
  if (filters?.sort) params.set("sort", filters.sort);

  const items = await serviceFetch<CatalogProduct[]>(
    "catalog",
    `/v1/catalog/products?${params.toString()}`
  );
  return items.map(toProduct);
}

export async function getCatalogProduct(id: string): Promise<Product | undefined> {
  try {
    const item = await serviceFetch<CatalogProduct>("catalog", `/v1/catalog/products/${encodeURIComponent(id)}`);
    return toProduct(item);
  } catch {
    return undefined;
  }
}

export function usePlatformCatalog(): boolean {
  return isPlatformEnabled();
}
