import { NextResponse } from "next/server";
import { restaurants } from "@/lib/data/restaurants";

export function GET() {
  return NextResponse.json({ restaurants });
}
