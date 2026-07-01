import { NextResponse } from "next/server";
import { products } from "@/lib/data/products";

export function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const product = products.find((p) => p.id === params.id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  const related = products
    .filter((p) => p.service === product.service && p.id !== product.id)
    .slice(0, 5);
  return NextResponse.json({ product, related });
}
