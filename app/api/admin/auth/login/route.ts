import { NextResponse } from "next/server";
import { z } from "zod";
import { loginAdmin } from "@/lib/admin/auth";
import { setAdminCookies } from "@/lib/admin/cookies";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  totpCode: z.string().length(6).optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const result = await loginAdmin(body.email, body.password, body.totpCode);

    if (!result.legacy && result.accessToken) {
      await setAdminCookies(result.accessToken, result.refreshToken);
    }

    return NextResponse.json({ admin: result.admin });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Login failed";
    const status = message.includes("2FA") ? 428 : message.includes("locked") ? 429 : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
