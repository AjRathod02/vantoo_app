import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/types";

export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/${c.service}?category=${encodeURIComponent(c.name)}`}
          className="flex w-20 shrink-0 flex-col items-center gap-2"
        >
          <span className="relative h-16 w-16 overflow-hidden rounded-full border border-gray-100 shadow-sm">
            <Image
              src={c.image}
              alt={c.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          </span>
          <span className="text-center text-xs font-medium text-ink">
            {c.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
