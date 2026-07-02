import type { Order, OrderStatus } from "@/lib/types";
import { hasAdminClient, createAdminClient } from "@/utils/supabase/admin";
import { products as seedProducts } from "@/lib/data/products";
import type { Product } from "@/lib/types";

type DbProductRow = {
  id: string;
  name: string;
  description: string;
  service: Product["service"];
  category: string;
  brand: string;
  price: number;
  original_price: number | null;
  rating: number;
  reviews: number;
  image: string;
  vendor_id: string | null;
  unit: string | null;
  in_stock: boolean;
};

function rowToProduct(row: DbProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    service: row.service,
    category: row.category,
    brand: row.brand,
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    rating: Number(row.rating),
    reviews: row.reviews,
    image: row.image,
    vendorId: row.vendor_id ?? undefined,
    unit: row.unit ?? undefined,
    inStock: row.in_stock,
  };
}

function productToRow(product: Product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    service: product.service,
    category: product.category,
    brand: product.brand,
    price: product.price,
    original_price: product.originalPrice ?? null,
    rating: product.rating,
    reviews: product.reviews,
    image: product.image,
    vendor_id: product.vendorId ?? null,
    unit: product.unit ?? null,
    in_stock: product.inStock,
    updated_at: new Date().toISOString(),
  };
}

export async function listProducts(filters?: {
  service?: string;
  category?: string;
  q?: string;
}): Promise<Product[]> {
  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      let query = supabase.from("products").select("*");
      if (filters?.service) query = query.eq("service", filters.service);
      if (filters?.category) query = query.eq("category", filters.category);
      if (filters?.q) {
        query = query.or(
          `name.ilike.%${filters.q}%,brand.ilike.%${filters.q}%,description.ilike.%${filters.q}%`
        );
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return (data as DbProductRow[]).map(rowToProduct);
      }
    } catch (e) {
      console.error("Supabase listProducts failed:", e);
    }
  }

  let list = [...seedProducts];
  if (filters?.service) list = list.filter((p) => p.service === filters.service);
  if (filters?.category)
    list = list.filter((p) => p.category === filters.category);
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }
  return list;
}

export async function getProduct(id: string): Promise<Product | undefined> {
  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) return rowToProduct(data as DbProductRow);
    } catch (e) {
      console.error("Supabase getProduct failed:", e);
    }
  }
  return seedProducts.find((p) => p.id === id);
}

export async function upsertProduct(product: Product) {
  if (!hasAdminClient()) throw new Error("Database not configured");
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").upsert(productToRow(product));
  if (error) throw new Error(error.message);
  return product;
}

export async function deleteProduct(id: string) {
  if (!hasAdminClient()) throw new Error("Database not configured");
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function seedProductsIfEmpty() {
  if (!hasAdminClient()) return { seeded: false, count: 0 };
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) return { seeded: false, count };

  const rows = seedProducts.map(productToRow);
  const { error } = await supabase.from("products").insert(rows);
  if (error) throw new Error(error.message);
  return { seeded: true, count: rows.length };
}
