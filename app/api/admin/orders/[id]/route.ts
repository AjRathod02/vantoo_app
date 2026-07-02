import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { updateOrder } from "@/lib/server/orders";
import type { OrderStatus } from "@/lib/types";
import { z } from "zod";

const patchSchema = z.object({
  status: z
    .enum(["confirmed", "packed", "out_for_delivery", "delivered", "cancelled"])
    .optional(),
  refundStatus: z
    .enum(["none", "requested", "processing", "completed"])
    .optional(),
  refundAmount: z.number().optional(),
  riderName: z.string().optional(),
  riderPhone: z.string().optional(),
  riderLat: z.number().optional(),
  riderLng: z.number().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }

    const patch = parsed.data;
    const order = await updateOrder(params.id, {
      status: patch.status as OrderStatus | undefined,
      refundStatus: patch.refundStatus,
      refundAmount: patch.refundAmount,
      paymentStatus:
        patch.refundStatus === "completed" ? "refunded" : undefined,
      tracking: {
        riderName: patch.riderName,
        riderPhone: patch.riderPhone,
        riderLat: patch.riderLat,
        riderLng: patch.riderLng,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
