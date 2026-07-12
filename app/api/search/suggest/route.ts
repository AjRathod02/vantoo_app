import { NextResponse } from "next/server";
import { getSearchSuggestions } from "@/lib/search/suggestions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const recent = (searchParams.get("recent") ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  const result = getSearchSuggestions(q, recent);
  return NextResponse.json(result);
}
