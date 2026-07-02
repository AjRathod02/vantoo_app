import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { upsertProduct, deleteProduct, getProduct } from "@/lib/server/products";
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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const product = await getProduct(params.id);
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = productSchema.safeParse({ ...body, id: params.id });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }
    const product = await upsertProduct(parsed.data as Product);
    return NextResponse.json({ product });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await deleteProduct(params.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
