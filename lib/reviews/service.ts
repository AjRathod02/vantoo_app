import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";
import { products as seedProducts } from "@/lib/data/products";

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  images: string[];
  videos: string[];
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  average: number;
  total: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

const memoryReviews: ProductReview[] = [
  {
    id: "rv1",
    productId: seedProducts[0]?.id ?? "p1",
    userId: "demo",
    userName: "Ananya S.",
    rating: 5,
    title: "Excellent quality",
    body: "Fresh and arrived quickly. Would order again.",
    images: [],
    videos: [],
    verifiedPurchase: true,
    helpfulCount: 12,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "rv2",
    productId: seedProducts[0]?.id ?? "p1",
    userId: "demo2",
    userName: "Rahul K.",
    rating: 4,
    title: "Good value",
    body: "Tastes great. Packaging could be better.",
    images: [],
    videos: [],
    verifiedPurchase: true,
    helpfulCount: 5,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

function summarize(reviews: ProductReview[]): ReviewSummary {
  const breakdown: ReviewSummary["breakdown"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const key = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
    breakdown[key] += 1;
  }
  const total = reviews.length;
  const average =
    total === 0
      ? 0
      : Number(
          (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
        );
  return { average, total, breakdown };
}

export async function listProductReviews(productId: string): Promise<{
  reviews: ProductReview[];
  summary: ReviewSummary;
}> {
  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (data?.length) {
        const userIds = [...new Set(data.map((r) => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", userIds);
        const names = new Map((profiles ?? []).map((p) => [p.id, p.name]));

        const reviews: ProductReview[] = data.map((r) => ({
          id: r.id,
          productId: r.product_id,
          userId: r.user_id,
          userName: names.get(r.user_id) ?? "Customer",
          rating: Number(r.rating),
          title: r.title ?? "",
          body: r.body ?? "",
          images: Array.isArray(r.images) ? r.images : [],
          videos: Array.isArray(r.videos) ? r.videos : [],
          verifiedPurchase: Boolean(r.verified_purchase),
          helpfulCount: Number(r.helpful_count ?? 0),
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
        return { reviews, summary: summarize(reviews) };
      }
    } catch (e) {
      console.error("listProductReviews:", e);
    }
  }

  const reviews = memoryReviews.filter((r) => r.productId === productId);
  // Fallback demo: show seed reviews on any product if none match
  const list =
    reviews.length > 0
      ? reviews
      : memoryReviews.map((r) => ({ ...r, productId }));
  return { reviews: list, summary: summarize(list) };
}

export async function upsertReview(input: {
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  body: string;
  images?: string[];
  videos?: string[];
  orderId?: string;
  verifiedPurchase?: boolean;
}): Promise<ProductReview> {
  const now = new Date().toISOString();

  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      const { data: existing } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("product_id", input.productId)
        .eq("user_id", input.userId)
        .maybeSingle();

      const payload = {
        product_id: input.productId,
        user_id: input.userId,
        rating: input.rating,
        title: input.title ?? "",
        body: input.body,
        images: input.images ?? [],
        videos: input.videos ?? [],
        order_id: input.orderId ?? null,
        verified_purchase: Boolean(input.verifiedPurchase),
        updated_at: now,
      };

      const { data, error } = existing
        ? await supabase
            .from("product_reviews")
            .update(payload)
            .eq("id", existing.id)
            .select()
            .single()
        : await supabase
            .from("product_reviews")
            .insert({ ...payload, created_at: now })
            .select()
            .single();

      if (!error && data) {
        return {
          id: data.id,
          productId: data.product_id,
          userId: data.user_id,
          userName: input.userName,
          rating: Number(data.rating),
          title: data.title ?? "",
          body: data.body ?? "",
          images: Array.isArray(data.images) ? data.images : [],
          videos: Array.isArray(data.videos) ? data.videos : [],
          verifiedPurchase: Boolean(data.verified_purchase),
          helpfulCount: Number(data.helpful_count ?? 0),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {
      console.error("upsertReview:", e);
    }
  }

  const idx = memoryReviews.findIndex(
    (r) => r.productId === input.productId && r.userId === input.userId
  );
  const review: ProductReview = {
    id: idx >= 0 ? memoryReviews[idx].id : `rv_${Date.now()}`,
    productId: input.productId,
    userId: input.userId,
    userName: input.userName,
    rating: input.rating,
    title: input.title ?? "",
    body: input.body,
    images: input.images ?? [],
    videos: input.videos ?? [],
    verifiedPurchase: Boolean(input.verifiedPurchase),
    helpfulCount: idx >= 0 ? memoryReviews[idx].helpfulCount : 0,
    createdAt: idx >= 0 ? memoryReviews[idx].createdAt : now,
    updatedAt: now,
  };
  if (idx >= 0) memoryReviews[idx] = review;
  else memoryReviews.unshift(review);
  return review;
}

export async function deleteReview(userId: string, reviewId: string) {
  if (hasAdminClient()) {
    try {
      await createAdminClient()
        .from("product_reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", userId);
      return { ok: true };
    } catch (e) {
      console.error("deleteReview:", e);
    }
  }
  const i = memoryReviews.findIndex(
    (r) => r.id === reviewId && r.userId === userId
  );
  if (i >= 0) memoryReviews.splice(i, 1);
  return { ok: true };
}

export async function markReviewHelpful(reviewId: string, userId: string) {
  if (hasAdminClient()) {
    try {
      const supabase = createAdminClient();
      await supabase.from("product_review_votes").upsert({
        review_id: reviewId,
        user_id: userId,
        helpful: true,
      });
      const { data } = await supabase
        .from("product_reviews")
        .select("helpful_count")
        .eq("id", reviewId)
        .single();
      const next = Number(data?.helpful_count ?? 0) + 1;
      await supabase
        .from("product_reviews")
        .update({ helpful_count: next })
        .eq("id", reviewId);
      return { ok: true, helpfulCount: next };
    } catch (e) {
      console.error("markReviewHelpful:", e);
    }
  }
  const r = memoryReviews.find((x) => x.id === reviewId);
  if (r) r.helpfulCount += 1;
  return { ok: true, helpfulCount: r?.helpfulCount ?? 0 };
}
