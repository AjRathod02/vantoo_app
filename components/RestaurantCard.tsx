import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link
      href={`/food?restaurant=${restaurant.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition-shadow hover:shadow-cardHover"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {restaurant.offer && (
          <span className="absolute bottom-2 left-2 rounded-lg bg-brand-secondary px-2 py-0.5 text-xs font-bold text-white">
            {restaurant.offer}
          </span>
        )}
        {restaurant.promoted && (
          <span className="absolute left-2 top-2 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Promoted
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-sm font-semibold text-ink">
            {restaurant.name}
          </h3>
          <Badge tone="green">{restaurant.rating.toFixed(1)}</Badge>
        </div>
        <p className="line-clamp-1 text-xs text-ink-soft">
          {restaurant.cuisine.join(", ")}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {restaurant.deliveryTime}
          </span>
          <span>{formatINR(restaurant.priceForTwo)} for two</span>
        </div>
      </div>
    </Link>
  );
}
