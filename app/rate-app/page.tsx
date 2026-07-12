"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";
import { useAuthStore } from "@/lib/stores/auth";
import { cn } from "@/lib/utils";

export default function RateAppPage() {
  const user = useAuthStore((s) => s.user);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (rating < 1) {
      toast.error("Please select a rating");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rate-app",
          rating,
          feedback,
          guestId: user ? undefined : `guest_${Date.now()}`,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setDone(true);
      toast.success("Thanks for rating Vantoo!");
    } catch {
      toast.error("Could not submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page max-w-md space-y-6 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-ink">Rate Our App</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {user ? `Hi ${user.name.split(" ")[0]} — ` : "Guests welcome — "}
          your feedback helps us improve.
        </p>
      </div>

      {done ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="font-semibold text-ink">Thank you!</p>
          <Link href="/" className="mt-4 inline-block text-sm text-brand-primary">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                aria-label={`${n} stars`}
              >
                <Star
                  className={cn(
                    "h-9 w-9",
                    (hover || rating) >= n
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  )}
                />
              </button>
            ))}
          </div>
          <textarea
            placeholder="Optional feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <Button fullWidth onClick={submit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      )}
    </div>
  );
}
