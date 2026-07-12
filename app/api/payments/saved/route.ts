import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import {
  listSavedPaymentMethods,
  removeSavedPaymentMethod,
  savePaymentMethod,
  updateSavedPaymentMethod,
} from "@/lib/payments/saved-methods";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const methods = await listSavedPaymentMethods(user.id);
  return NextResponse.json({ methods });
}

const createSchema = z.object({
  type: z.enum(["upi", "card"]),
  label: z.string().min(1),
  upiId: z.string().optional(),
  cardLast4: z.string().length(4).optional(),
  cardNetwork: z.string().optional(),
  cardExpiry: z.string().optional(),
  razorpayTokenId: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }
  if (parsed.data.type === "upi" && !parsed.data.upiId) {
    return NextResponse.json({ error: "UPI ID required" }, { status: 400 });
  }
  if (parsed.data.type === "card") {
    // Never accept raw card numbers — only last4 + token
    if (!parsed.data.cardLast4) {
      return NextResponse.json(
        { error: "Tokenized card details required (last4)" },
        { status: 400 }
      );
    }
  }
  try {
    const method = await savePaymentMethod(user.id, parsed.data);
    return NextResponse.json({ method }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const method = await updateSavedPaymentMethod(user.id, body.id, {
    label: body.label,
    isDefault: body.isDefault,
  });
  return NextResponse.json({ method });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await removeSavedPaymentMethod(user.id, id);
  return NextResponse.json({ ok: true });
}
