import { createAdminClient, hasAdminClient } from "@/utils/supabase/admin";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  videoUrl?: string;
  category: string;
  contentType: "article" | "video";
  authorName: string;
  publishedAt: string;
}

export interface BlogComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

const SEED_POSTS: BlogPost[] = [
  {
    id: "b1",
    slug: "welcome-to-vantoo",
    title: "Welcome to Vantoo — Your Everyday Super App",
    excerpt: "Food, groceries, medicine, and shopping in one place.",
    content:
      "Vantoo brings local commerce together with fast delivery, secure payments, and live tracking.\n\nWhether you need dinner tonight or weekly groceries, we are building a platform that is transparent for customers and fair for partners.",
    coverImage:
      "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=1200&q=80",
    category: "updates",
    contentType: "article",
    authorName: "Vantoo Team",
    publishedAt: new Date(Date.now() - 5 * 864e5).toISOString(),
  },
  {
    id: "b2",
    slug: "how-live-tracking-works",
    title: "How Live Order Tracking Works",
    excerpt: "Follow your rider in real time from kitchen to doorstep.",
    content:
      "Every order moves through clear stages — confirmed, preparing, packed, assigned, picked up, out for delivery, and delivered. Open Track Order anytime to see timestamps and map updates.",
    coverImage:
      "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80",
    category: "delivery",
    contentType: "article",
    authorName: "Vantoo Ops",
    publishedAt: new Date(Date.now() - 4 * 864e5).toISOString(),
  },
  {
    id: "b3",
    slug: "grocery-tips-fresh-produce",
    title: "5 Tips for Fresher Groceries",
    excerpt: "Simple habits that keep your produce fresher longer.",
    content:
      "1. Store leafy greens with a paper towel.\n2. Keep bananas separate from other fruit.\n3. Refrigerate dairy immediately.\n4. Use FIFO — first in, first out.\n5. Check expiry dates on the product page before ordering.",
    coverImage:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80",
    category: "tips",
    contentType: "article",
    authorName: "Vantoo Kitchen",
    publishedAt: new Date(Date.now() - 3 * 864e5).toISOString(),
  },
  {
    id: "b4",
    slug: "safety-guidelines-delivery",
    title: "Delivery Safety Guidelines",
    excerpt: "How we keep customers, riders, and vendors safe.",
    content:
      "Contactless delivery is available on request. Riders follow traffic rules and package handling standards. Report safety concerns instantly from Help Center.",
    coverImage:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80",
    category: "safety",
    contentType: "article",
    authorName: "Vantoo Trust",
    publishedAt: new Date(Date.now() - 2 * 864e5).toISOString(),
  },
  {
    id: "b5",
    slug: "refer-earn-explained",
    title: "Refer & Earn Explained",
    excerpt: "Invite friends and earn on their first eligible order.",
    content:
      "Share your referral code from Refer & Earn. When a new friend places their first delivered order of ₹350+, you earn commission in your referral wallet.",
    coverImage:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80",
    category: "features",
    contentType: "article",
    authorName: "Vantoo Growth",
    publishedAt: new Date(Date.now() - 1 * 864e5).toISOString(),
  },
  {
    id: "b6",
    slug: "vantoo-promo-video",
    title: "Inside a Day at Vantoo",
    excerpt: "A short look at how orders move across the city.",
    content:
      "Watch how restaurants, dark stores, and riders coordinate to deliver on time.",
    coverImage:
      "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=1200&q=80",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    category: "promotional",
    contentType: "video",
    authorName: "Vantoo Studio",
    publishedAt: new Date().toISOString(),
  },
];

const memoryComments: Record<string, BlogComment[]> = {};

function mapPost(row: Record<string, unknown>): BlogPost {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    excerpt: String(row.excerpt ?? ""),
    content: String(row.content ?? ""),
    coverImage: String(row.cover_image ?? ""),
    videoUrl: row.video_url ? String(row.video_url) : undefined,
    category: String(row.category),
    contentType: (row.content_type as "article" | "video") || "article",
    authorName: String(row.author_name ?? "Vantoo Team"),
    publishedAt: String(row.published_at),
  };
}

export async function listBlogPosts(opts?: {
  category?: string;
  q?: string;
  type?: "article" | "video";
}): Promise<BlogPost[]> {
  if (hasAdminClient()) {
    try {
      let q = createAdminClient()
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (opts?.category) q = q.eq("category", opts.category);
      if (opts?.type) q = q.eq("content_type", opts.type);
      const { data } = await q;
      if (data?.length) {
        let posts = data.map(mapPost);
        if (opts?.q) {
          const needle = opts.q.toLowerCase();
          posts = posts.filter(
            (p) =>
              p.title.toLowerCase().includes(needle) ||
              p.excerpt.toLowerCase().includes(needle)
          );
        }
        return posts;
      }
    } catch (e) {
      console.error("listBlogPosts:", e);
    }
  }

  let posts = [...SEED_POSTS];
  if (opts?.category) posts = posts.filter((p) => p.category === opts.category);
  if (opts?.type) posts = posts.filter((p) => p.contentType === opts.type);
  if (opts?.q) {
    const needle = opts.q.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(needle) ||
        p.excerpt.toLowerCase().includes(needle)
    );
  }
  return posts;
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await listBlogPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function listBlogComments(postId: string): Promise<BlogComment[]> {
  if (hasAdminClient()) {
    try {
      const { data } = await createAdminClient()
        .from("blog_comments")
        .select("*")
        .eq("post_id", postId)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (data) {
        return data.map((c) => ({
          id: c.id,
          authorName: c.author_name,
          body: c.body,
          createdAt: c.created_at,
        }));
      }
    } catch (e) {
      console.error("listBlogComments:", e);
    }
  }
  return memoryComments[postId] ?? [];
}

export async function addBlogComment(input: {
  postId: string;
  userId?: string;
  authorName: string;
  body: string;
}) {
  if (hasAdminClient()) {
    try {
      const { data } = await createAdminClient()
        .from("blog_comments")
        .insert({
          post_id: input.postId,
          user_id: input.userId ?? null,
          author_name: input.authorName,
          body: input.body,
        })
        .select()
        .single();
      if (data) {
        return {
          id: data.id,
          authorName: data.author_name,
          body: data.body,
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.error("addBlogComment:", e);
    }
  }
  const comment: BlogComment = {
    id: `bc_${Date.now()}`,
    authorName: input.authorName,
    body: input.body,
    createdAt: new Date().toISOString(),
  };
  memoryComments[input.postId] = [comment, ...(memoryComments[input.postId] ?? [])];
  return comment;
}
