"use client";

import { useEffect, useState } from "react";
import { Star, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/lib/stores/toast";
import { useAuthStore } from "@/lib/stores/auth";
import { cn } from "@/lib/utils";
import type { ProductReview, ReviewSummary } from "@/lib/reviews/service";

export function ProductReviews({ productId }: { productId: string }) {
  const user = useAuthStore((s) => s.user);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () =>
    fetch(`/api/products/${productId}/reviews`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews ?? []);
        setSummary(d.summary ?? null);
      });

  useEffect(() => {
    load();
  }, [productId]);

  const submit = async () => {
    if (!user) {
      toast.error("Login to write a review");
      return;
    }
    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating,
        title,
        body,
        images: images
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });
    if (res.ok) {
      toast.success(editingId ? "Review updated" : "Review posted");
      setTitle("");
      setBody("");
      setImages("");
      setEditingId(null);
      load();
    } else {
      toast.error("Could not save review");
    }
  };

  const remove = async (reviewId: string) => {
    await fetch(
      `/api/products/${productId}/reviews?reviewId=${reviewId}`,
      { method: "DELETE" }
    );
    toast.success("Review deleted");
    load();
  };

  const helpful = async (reviewId: string) => {
    if (!user) {
      toast.error("Login to vote");
      return;
    }
    await fetch(`/api/products/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "helpful", reviewId }),
    });
    load();
  };

  const maxBar = Math.max(1, ...(summary ? Object.values(summary.breakdown) : [1]));

  return (
    <section className="mt-10 space-y-6">
      <h2 className="text-xl font-bold text-ink">Customer Reviews</h2>

      {summary && (
        <div className="grid gap-6 rounded-2xl border border-gray-100 p-5 shadow-card sm:grid-cols-[180px_1fr]">
          <div className="text-center">
            <p className="text-4xl font-extrabold text-ink">{summary.average}</p>
            <div className="mt-1 flex justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={cn(
                    "h-4 w-4",
                    n <= Math.round(summary.average)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-soft">{summary.total} ratings</p>
          </div>
          <div className="space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((n) => (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-ink-muted">{n}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{
                      width: `${(summary.breakdown[n] / maxBar) * 100}%`,
                    }}
                  />
                </div>
                <span className="w-6 text-ink-soft">{summary.breakdown[n]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {user && (
        <div className="space-y-3 rounded-2xl border border-gray-100 p-5 shadow-card">
          <h3 className="font-semibold text-ink">
            {editingId ? "Edit your review" : "Write a review"}
          </h3>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)}>
                <Star
                  className={cn(
                    "h-6 w-6",
                    n <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  )}
                />
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your experience"
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <textarea
            value={images}
            onChange={(e) => setImages(e.target.value)}
            placeholder="Photo/video URLs (one per line)"
            rows={2}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <Button onClick={submit}>
            {editingId ? "Update Review" : "Post Review"}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-gray-100 p-4 shadow-card"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-ink">{r.userName}</p>
              {r.verifiedPurchase && (
                <Badge tone="green">Verified Purchase</Badge>
              )}
              <span className="text-xs text-ink-soft">
                {new Date(r.createdAt).toLocaleDateString("en-IN")}
              </span>
            </div>
            <div className="mt-1 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={cn(
                    "h-3.5 w-3.5",
                    n <= r.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            {r.title && (
              <p className="mt-2 text-sm font-semibold text-ink">{r.title}</p>
            )}
            <p className="mt-1 text-sm text-ink-muted">{r.body}</p>
            {r.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {r.images.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt="Review"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => helpful(r.id)}
                className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand-primary"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                Helpful ({r.helpfulCount})
              </button>
              {user?.id === r.userId && (
                <>
                  <button
                    type="button"
                    className="text-xs text-brand-primary"
                    onClick={() => {
                      setEditingId(r.id);
                      setRating(r.rating);
                      setTitle(r.title);
                      setBody(r.body);
                      setImages(r.images.join("\n"));
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() => remove(r.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
