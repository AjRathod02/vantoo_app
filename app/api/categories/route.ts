import { NextResponse } from "next/server";
import { getCategories } from "@/lib/data/categories";

export async function GET(request: Request) {
  try {
    const service = new URL(request.url).searchParams.get("service") ?? undefined;
    const categories = await getCategories(service ?? undefined);
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ categories: [] });
  }
}
