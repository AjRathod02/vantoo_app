import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { listProducts, upsertProduct } from "@/lib/server/products";
import type { Product } from "@/lib/types";
import { z } from "zod";

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  service: z.enum(["food", "grocery", "medicine", "ecommerce"]),
  category: z.string(),
  brand: z.string(),
  price: z.number(),
  originalPrice: z.number().optional(),
  rating: z.number(),
  reviews: z.number(),
  image: z.string(),
  vendorId: z.string().optional(),
  unit: z.string().optional(),
  inStock: z.boolean(),
});

export async function GET() {
  try {
    await requireAdmin();
    const products = await listProducts();
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }
    const product = await upsertProduct(parsed.data as Product);
    return NextResponse.json({ product }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Forbidden";
    const status = message === "Forbidden" || message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
