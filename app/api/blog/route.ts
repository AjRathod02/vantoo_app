import { NextResponse } from "next/server";
import { listBlogPosts, getBlogPost, addBlogComment, listBlogComments } from "@/lib/blog/service";
import { getSessionUser } from "@/lib/server/auth";
import { z } from "zod";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (slug) {
    const post = await getBlogPost(slug);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const comments = await listBlogComments(post.id);
    return NextResponse.json({ post, comments });
  }
  const posts = await listBlogPosts({
    category: searchParams.get("category") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    type: (searchParams.get("type") as "article" | "video") || undefined,
  });
  return NextResponse.json({ posts });
}

const commentSchema = z.object({
  postId: z.string().min(1),
  body: z.string().min(2),
  authorName: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
  }
  const user = await getSessionUser();
  const comment = await addBlogComment({
    postId: parsed.data.postId,
    userId: user?.id,
    authorName: parsed.data.authorName || user?.name || "Guest",
    body: parsed.data.body,
  });
  return NextResponse.json({ comment }, { status: 201 });
}
