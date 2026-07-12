"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import type { BlogPost } from "@/lib/blog/service";

const CATEGORIES = [
  "all",
  "updates",
  "delivery",
  "tips",
  "safety",
  "features",
  "promotional",
];

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [category, setCategory] = useState("all");
  const [type, setType] = useState<"all" | "article" | "video">("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (type !== "all") params.set("type", type);
    if (q.trim()) params.set("q", q.trim());
    fetch(`/api/blog?${params}`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []));
  }, [category, type, q]);

  return (
    <div className="container-page space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold text-ink">Blogs & Videos</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Company updates, tips, safety guidelines, and promotional videos.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <Input
            className="pl-10"
            placeholder="Search articles and videos"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "article", "video"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-xl px-3 py-2 text-sm capitalize ${
                type === t ? "bg-brand-primary text-white" : "bg-gray-100 text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-xl px-3 py-1.5 text-sm capitalize ${
              category === c
                ? "bg-brand-surface text-brand-primary"
                : "text-ink-muted hover:bg-gray-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-shadow hover:shadow-cardHover"
          >
            <div className="relative aspect-[16/10] bg-gray-50">
              {post.coverImage && (
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              )}
              {post.contentType === "video" && (
                <span className="absolute inset-0 grid place-items-center bg-black/30">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand-primary">
                    <Play className="h-5 w-5 fill-current" />
                  </span>
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="text-xs uppercase tracking-wide text-brand-primary">
                {post.category} · {post.contentType}
              </p>
              <h2 className="mt-1 line-clamp-2 font-semibold text-ink">
                {post.title}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                {post.excerpt}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
