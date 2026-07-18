import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import {
  deleteReview,
  listProductReviews,
  markReviewHelpful,
  upsertReview,
} from "@/lib/reviews/service";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const data = await listProductReviews(params.id);
  return NextResponse.json(data);
}

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().min(5),
  images: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  orderId: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const body = await request.json();
  if (body.action === "helpful") {
    const result = await markReviewHelpful(String(body.reviewId), user.id);
    return NextResponse.json(result);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  }

  let verifiedPurchase = false;
  if (parsed.data.orderId) {
    const { getOrder } = await import("@/lib/server/orders");
    const order = await getOrder(parsed.data.orderId, user.id);
    verifiedPurchase = Boolean(
      order &&
        order.userId === user.id &&
        order.items.some((i) => i.productId === params.id)
    );
  }

  const review = await upsertReview({
    productId: params.id,
    userId: user.id,
    userName: user.name,
    ...parsed.data,
    verifiedPurchase,
  });

  return NextResponse.json({ review }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const reviewId = searchParams.get("reviewId");
  if (!reviewId) {
    return NextResponse.json({ error: "reviewId required" }, { status: 400 });
  }
  await deleteReview(user.id, reviewId);
  return NextResponse.json({ ok: true, productId: params.id });
}
