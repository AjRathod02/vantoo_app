import { NextResponse } from "next/server";
import {
  isDatabaseConfigured,
  runDatabaseMigration,
} from "@/lib/server/setup-db";

export async function POST(request: Request) {
  const secret = request.headers.get("x-seed-secret");
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "DATABASE_URL is not set. Add it from Supabase → Project Settings → Database → Connection string (URI).",
      },
      { status: 503 }
    );
  }

  try {
    const result = await runDatabaseMigration(process.env.DATABASE_URL!);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Migration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
