"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ImageIcon, Star, Video } from "lucide-react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable, type AdminColumn } from "@/components/admin/AdminDataTable";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { AdminActionsMenu } from "@/components/admin/AdminActionsMenu";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { toast } from "@/lib/stores/toast";

type Review = {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  title: string;
  body: string;
  images: string[];
  videos: string[];
  verified_purchase?: boolean;
  is_published?: boolean;
  moderation_status: string;
  review_type: string;
  target_id: string;
  reviewer_name: string;
  created_at: string;
  deleted_at: string | null;
};

function truncateText(title: string, body: string, max = 80): string {
  const combined = [title, body].filter(Boolean).join(" — ");
  if (combined.length <= max) return combined || "—";
  return `${combined.slice(0, max)}…`;
}

function ReviewsPageContent() {
  const searchParams = useSearchParams();
  const userFromUrl = searchParams.get("user") ?? "";

  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [rating, setRating] = useState("");
  const [type, setType] = useState("");
  const [selected, setSelected] = useState<Review | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (rating) params.set("rating", rating);
    if (type) params.set("type", type);
    if (userFromUrl) params.set("user", userFromUrl);

    fetch(`/api/admin/reviews?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => toast.error("Failed to load reviews"))
      .finally(() => setLoading(false));
  }, [search, status, rating, type, userFromUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const mutate = async (reviewId: string, action: "hide" | "restore" | "delete", success: string) => {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, action }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Action failed");
      return;
    }
    toast.success(success);
    if (selected?.id === reviewId && action === "delete") setSelected(null);
    load();
  };

  const columns: AdminColumn<Review>[] = useMemo(
    () => [
      {
        key: "id",
        label: "Review ID",
        sortable: true,
        sortValue: (r) => r.id,
        render: (r) => (
          <span className="font-mono text-xs text-ink-muted">{r.id.slice(0, 8)}…</span>
        ),
      },
      {
        key: "reviewer",
        label: "Reviewer",
        sortable: true,
        sortValue: (r) => r.reviewer_name,
        render: (r) => <span className="font-medium text-ink">{r.reviewer_name || "—"}</span>,
      },
      {
        key: "type",
        label: "Review Type",
        sortable: true,
        sortValue: (r) => r.review_type,
        render: (r) => <span className="capitalize text-ink-muted">{r.review_type || "product"}</span>,
      },
      {
        key: "rating",
        label: "Rating",
        sortable: true,
        sortValue: (r) => r.rating,
        render: (r) => (
          <span className="inline-flex items-center gap-1 font-medium text-ink">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {r.rating}
          </span>
        ),
      },
      {
        key: "text",
        label: "Review Text",
        render: (r) => (
          <span className="text-sm text-ink-muted">{truncateText(r.title, r.body)}</span>
        ),
      },
      {
        key: "media",
        label: "Images/Videos",
        render: (r) => (
          <span className="inline-flex items-center gap-2 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-0.5">
              <ImageIcon className="h-3.5 w-3.5" />
              {(r.images ?? []).length}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Video className="h-3.5 w-3.5" />
              {(r.videos ?? []).length}
            </span>
          </span>
        ),
      },
      {
        key: "date",
        label: "Date",
        sortable: true,
        sortValue: (r) => new Date(r.created_at).getTime(),
        render: (r) => (
          <span className="text-ink-muted">
            {new Date(r.created_at).toLocaleDateString("en-IN")}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        sortValue: (r) => r.moderation_status,
        render: (r) => <AdminStatusBadge status={r.moderation_status} />,
      },
      {
        key: "actions",
        label: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        render: (r) => (
          <AdminActionsMenu
            items={[
              { label: "View", onClick: () => setSelected(r) },
              {
                label: "Hide",
                onClick: () => mutate(r.id, "hide", "Review hidden"),
                disabled: r.moderation_status === "hidden" || r.moderation_status === "deleted",
              },
              {
                label: "Restore",
                tone: "success",
                onClick: () => mutate(r.id, "restore", "Review restored"),
                disabled: r.moderation_status === "published",
              },
              { divider: true, label: "", onClick: () => {} },
              {
                label: "Delete",
                tone: "danger",
                onClick: () => {
                  if (!confirm("Soft-delete this review?")) return;
                  mutate(r.id, "delete", "Review deleted");
                },
              },
            ]}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <AdminPageShell
      title="Reviews Management"
      subtitle={
        userFromUrl
          ? `${total} reviews · filtered by customer ${userFromUrl.slice(0, 8)}…`
          : `${total} reviews · moderate ratings, media & visibility`
      }
    >
      <div className="space-y-4">
        {userFromUrl && (
          <p className="rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-800">
            Showing reviews for user{" "}
            <span className="font-mono font-medium">{userFromUrl}</span>
          </p>
        )}

        <AdminFilterBar
          search={search}
          onSearchChange={setSearch}
          onSearchSubmit={load}
          placeholder="Search reviewer, title, body, product ID…"
          filters={[
            {
              key: "rating",
              label: "Rating",
              value: rating,
              onChange: setRating,
              options: [
                { value: "", label: "All" },
                ...([1, 2, 3, 4, 5] as const).map((n) => ({
                  value: String(n),
                  label: `${n}★`,
                })),
              ],
            },
            {
              key: "status",
              label: "Status",
              value: status,
              onChange: setStatus,
              options: [
                { value: "", label: "All" },
                { value: "published", label: "Published" },
                { value: "hidden", label: "Hidden" },
                { value: "deleted", label: "Deleted" },
                { value: "pending", label: "Pending" },
              ],
            },
            {
              key: "type",
              label: "Type",
              value: type,
              onChange: setType,
              options: [
                { value: "", label: "All" },
                { value: "product", label: "Product" },
                { value: "order", label: "Order" },
                { value: "vendor", label: "Vendor" },
                { value: "rider", label: "Rider" },
              ],
            },
          ]}
        />

        {loading ? (
          <AdminTableSkeleton cols={9} />
        ) : (
          <AdminDataTable
            rows={reviews}
            columns={columns}
            rowKey={(r) => r.id}
            pageSize={20}
            minWidth="1100px"
            emptyMessage="No reviews found."
          />
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink">{selected.reviewer_name}</h2>
                <p className="text-sm text-ink-muted">
                  {selected.review_type} · {selected.rating}★ ·{" "}
                  {new Date(selected.created_at).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <AdminStatusBadge status={selected.moderation_status} />
                <button
                  type="button"
                  className="text-sm text-ink-muted hover:text-ink"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </div>
            </div>

            {selected.title && (
              <h3 className="mb-2 font-semibold text-ink">{selected.title}</h3>
            )}
            <p className="mb-4 whitespace-pre-wrap text-sm text-ink-muted">{selected.body || "—"}</p>

            <div className="mb-4 grid gap-2 text-xs text-ink-muted sm:grid-cols-2">
              <p>
                <span className="font-medium text-ink">Review ID:</span> {selected.id}
              </p>
              <p>
                <span className="font-medium text-ink">Product:</span> {selected.product_id}
              </p>
              <p>
                <span className="font-medium text-ink">User:</span> {selected.user_id}
              </p>
              {selected.order_id && (
                <p>
                  <span className="font-medium text-ink">Order:</span> {selected.order_id}
                </p>
              )}
            </div>

            {(selected.images?.length ?? 0) > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold text-ink">
                  Images ({selected.images.length})
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {selected.images.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="aspect-square rounded-xl border border-gray-100 object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {(selected.videos?.length ?? 0) > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold text-ink">
                  Videos ({selected.videos.length})
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selected.videos.map((url, i) => (
                    <video
                      key={i}
                      src={url}
                      controls
                      className="aspect-video w-full rounded-xl border border-gray-100 bg-black"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              {selected.moderation_status !== "hidden" &&
                selected.moderation_status !== "deleted" && (
                  <button
                    type="button"
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    onClick={() => mutate(selected.id, "hide", "Review hidden")}
                  >
                    Hide
                  </button>
                )}
              {selected.moderation_status !== "published" && (
                <button
                  type="button"
                  className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
                  onClick={() => mutate(selected.id, "restore", "Review restored")}
                >
                  Restore
                </button>
              )}
              <button
                type="button"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-brand-secondary hover:bg-red-100"
                onClick={() => {
                  if (!confirm("Soft-delete this review?")) return;
                  mutate(selected.id, "delete", "Review deleted");
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}

export default function AdminReviewsPage() {
  return (
    <Suspense
      fallback={
        <AdminPageShell title="Reviews Management" subtitle="Loading…">
          <AdminTableSkeleton cols={9} />
        </AdminPageShell>
      }
    >
      <ReviewsPageContent />
    </Suspense>
  );
}
