import { products } from "@/lib/data/products";
import { restaurants } from "@/lib/data/restaurants";
import { categories } from "@/lib/data/categories";

const TRENDING = [
  "biryani",
  "pizza",
  "milk",
  "medicine",
  "headphones",
  "coffee",
  "dosa",
  "fruits",
];

const HISTORY_KEY_PREFIX = "vantoo-search-history:";

function levenshtein(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function correctTypo(query: string, dictionary: string[]): string | null {
  const q = query.toLowerCase();
  let best: string | null = null;
  let bestDist = 3;
  for (const word of dictionary) {
    const d = levenshtein(q, word.toLowerCase());
    if (d > 0 && d < bestDist) {
      bestDist = d;
      best = word;
    }
  }
  return best;
}

export interface SearchSuggestion {
  type: "product" | "restaurant" | "category" | "brand" | "popular" | "recent";
  label: string;
  href: string;
  meta?: string;
}

export function getSearchSuggestions(
  query: string,
  recent: string[] = []
): {
  suggestions: SearchSuggestion[];
  corrected?: string;
  trending: string[];
} {
  const q = query.trim().toLowerCase();
  const suggestions: SearchSuggestion[] = [];

  if (!q) {
    return {
      suggestions: [
        ...recent.slice(0, 5).map((r) => ({
          type: "recent" as const,
          label: r,
          href: `/search?q=${encodeURIComponent(r)}`,
        })),
        ...TRENDING.slice(0, 6).map((t) => ({
          type: "popular" as const,
          label: t,
          href: `/search?q=${encodeURIComponent(t)}`,
        })),
      ],
      trending: TRENDING,
    };
  }

  const brands = [...new Set(products.map((p) => p.brand))];
  const dict = [
    ...products.map((p) => p.name),
    ...restaurants.map((r) => r.name),
    ...categories.map((c) => c.name),
    ...brands,
    ...TRENDING,
  ];
  const corrected = correctTypo(q, dict) ?? undefined;

  for (const p of products) {
    if (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    ) {
      suggestions.push({
        type: "product",
        label: p.name,
        href: `/product/${p.id}`,
        meta: p.brand,
      });
    }
    if (suggestions.filter((s) => s.type === "product").length >= 5) break;
  }

  for (const r of restaurants) {
    if (
      r.name.toLowerCase().includes(q) ||
      r.cuisine.some((c) => c.toLowerCase().includes(q))
    ) {
      suggestions.push({
        type: "restaurant",
        label: r.name,
        href: `/food?restaurant=${r.id}`,
        meta: r.cuisine.slice(0, 2).join(", "),
      });
    }
    if (suggestions.filter((s) => s.type === "restaurant").length >= 4) break;
  }

  for (const c of categories) {
    if (c.name.toLowerCase().includes(q)) {
      suggestions.push({
        type: "category",
        label: c.name,
        href: `/${c.service}?category=${encodeURIComponent(c.name)}`,
      });
    }
  }

  for (const b of brands) {
    if (b.toLowerCase().includes(q)) {
      suggestions.push({
        type: "brand",
        label: b,
        href: `/search?q=${encodeURIComponent(b)}`,
        meta: "Brand",
      });
    }
    if (suggestions.filter((s) => s.type === "brand").length >= 3) break;
  }

  for (const t of TRENDING) {
    if (t.includes(q)) {
      suggestions.push({
        type: "popular",
        label: t,
        href: `/search?q=${encodeURIComponent(t)}`,
      });
    }
  }

  return { suggestions: suggestions.slice(0, 12), corrected, trending: TRENDING };
}

export function readRecentSearches(userKey = "guest"): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY_PREFIX + userKey);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string, userKey = "guest") {
  if (typeof window === "undefined" || !query.trim()) return;
  const next = [
    query.trim(),
    ...readRecentSearches(userKey).filter(
      (q) => q.toLowerCase() !== query.trim().toLowerCase()
    ),
  ].slice(0, 10);
  localStorage.setItem(HISTORY_KEY_PREFIX + userKey, JSON.stringify(next));
}
