import { NextResponse } from "next/server";
import { offers } from "@/lib/data/offers";

/** Homepage / marketing banners. Restaurant flash offers: GET /api/promotions */
export async function GET() {
  return NextResponse.json({ offers });
}
