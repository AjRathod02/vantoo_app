import { NextResponse } from "next/server";
import { offers } from "@/lib/data/offers";

export function GET() {
  return NextResponse.json({ offers });
}
