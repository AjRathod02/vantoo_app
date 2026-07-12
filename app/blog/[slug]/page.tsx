"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";
import { useAuthStore } from "@/lib/stores/auth";
import type { BlogComment, BlogPost } from "@/lib/blog/service";

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const user = useAuthStore((s) => s.user);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [body, setBody] = useState("");

  useEffect(() => {
    fetch(`/api/blog?slug=${params.slug}`)
      .then((r) => r.json())
      .then((d) => {
        setPost(d.post ?? null);
        setComments(d.comments ?? []);
      });
  }, [params.slug]);

  const submitComment = async () => {
    if (!post || !body.trim()) return;
    const res = await fetch("/api/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId: post.id,
        body,
        authorName: user?.name,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setComments((c) => [data.comment, ...c]);
      setBody("");
      toast.success("Comment added");
    }
  };

  if (!post) {
    return (
      <div className="container-page py-10 text-ink-muted">Loading...</div>
    );
  }

  return (
    <article className="container-page max-w-3xl space-y-6 py-8">
      <Link href="/blog" className="text-sm text-brand-primary">
        ← Blogs & Videos
      </Link>
      <div>
        <p className="text-xs uppercase tracking-wide text-brand-primary">
          {post.category} · {post.contentType}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink">{post.title}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {post.authorName} ·{" "}
          {new Date(post.publishedAt).toLocaleDateString("en-IN")}
        </p>
      </div>

      {post.coverImage && (
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-gray-50">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      {post.videoUrl && (
        <div className="aspect-video overflow-hidden rounded-2xl">
          <iframe
            src={post.videoUrl}
            title={post.title}
            className="h-full w-full"
            allowFullScreen
          />
        </div>
      )}

      <div className="space-y-4 text-sm leading-relaxed text-ink-muted whitespace-pre-line">
        {post.content}
      </div>

      <section className="rounded-2xl border border-gray-100 p-5 shadow-card">
        <h2 className="font-semibold text-ink">Comments</h2>
        <div className="mt-3 space-y-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Share your thoughts..."
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <Button onClick={submitComment}>Post Comment</Button>
        </div>
        <div className="mt-4 space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-ink-soft">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-xs text-ink-soft">
                  {c.authorName} ·{" "}
                  {new Date(c.createdAt).toLocaleDateString("en-IN")}
                </p>
                <p className="mt-1 text-sm text-ink">{c.body}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </article>
  );
}
