"use client";

import { memo, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { Check, Phone, MessageCircle, Star } from "lucide-react";
import type { Order, RiderLocationUpdate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/stores/toast";
import {
  buildRiderCallUrl,
  buildRiderMessageUrl,
} from "@/lib/tracking/riderContact";
import {
  buildOrderTimeline,
  TIMELINE_LABELS,
} from "@/lib/orderStatus";

export const OrderTrackingTimeline = memo(function OrderTrackingTimeline({
  status,
  placedAt,
  statusHistory,
  etaMinutes,
  className,
}: {
  status: Order["status"];
  placedAt?: string;
  statusHistory?: Order["statusHistory"];
  etaMinutes?: number;
  className?: string;
}) {
  const placed = placedAt ?? new Date().toISOString();

  const items = [
    {
      status: "pending" as const,
      label: TIMELINE_LABELS.pending ?? "Order Placed",
      description: "Your order was placed successfully",
      at: placed,
      done: status !== "cancelled",
      active: false,
      etaLabel: undefined as string | undefined,
    },
    ...buildOrderTimeline(status, placed, statusHistory, etaMinutes),
  ];

  // Rider Accepted sits between assigned and picked — show as note on assigned when done
  return (
    <ol className={cn("space-y-0", className)}>
      {items.map((item, i) => (
        <li key={`${item.status}-${i}`} className="flex gap-3">
          <div className="flex flex-col items-center">
            <motion.span
              layout
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full border-2 transition-colors",
                item.done
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-gray-300 bg-white text-ink-soft",
                item.active && "ring-4 ring-brand-primary/20"
              )}
            >
              {item.done ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-gray-300" />
              )}
            </motion.span>
            {i < items.length - 1 && (
              <span
                className={cn(
                  "my-1 h-8 w-0.5",
                  item.done && items[i + 1]?.done
                    ? "bg-brand-primary"
                    : "bg-gray-200"
                )}
              />
            )}
          </div>
          <div className="pb-6 pt-1">
            <p
              className={cn(
                "text-sm font-semibold",
                item.done ? "text-ink" : "text-ink-soft"
              )}
            >
              {item.label}
              {item.status === "assigned" && item.done ? " · Rider Accepted" : ""}
            </p>
            <p className="text-xs text-ink-soft">{item.description}</p>
            {item.at && (
              <p className="mt-1 text-xs font-medium text-ink-muted">
                {new Date(item.at).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            )}
            {item.etaLabel && (
              <p className="mt-0.5 text-xs font-semibold text-brand-primary">
                {item.etaLabel}
              </p>
            )}
            {item.status === "in_transit" && item.active && etaMinutes != null && (
              <p className="mt-0.5 text-xs font-semibold text-brand-primary">
                Estimated Arrival: ~{etaMinutes} min
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
});

export const TrackingBottomCard = memo(function TrackingBottomCard({
  order,
  location,
}: {
  order: Order;
  location: RiderLocationUpdate | null;
}) {
  const riderName = location?.riderName ?? order.tracking?.riderName ?? "Rider";
  const rating = location?.riderRating ?? order.tracking?.riderRating ?? 4.9;
  const eta = location?.etaMinutes ?? order.tracking?.etaMinutes ?? 12;
  const distance =
    location?.distanceKm ?? order.tracking?.distanceKm ?? 2.8;
  const phone = location?.riderPhone ?? order.tracking?.riderPhone;
  const callUrl = phone ? buildRiderCallUrl(phone) : null;
  const messageUrl = phone
    ? buildRiderMessageUrl(phone, order.id, riderName)
    : null;

  const handleUnavailable = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    toast.error("Rider contact is not available yet. Please try again shortly.");
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-surface text-xl">
            🛵
          </span>
          <div>
            <p className="text-sm font-bold text-ink">
              {riderName} is delivering your order
            </p>
            <p className="flex items-center gap-1 text-xs text-ink-muted">
              <Star className="h-3.5 w-3.5 fill-brand-primary text-brand-primary" />
              {rating} Rating
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={callUrl ?? "#"}
            onClick={callUrl ? undefined : handleUnavailable}
            aria-label="Call rider"
            title="Call rider"
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full bg-brand-primary text-white transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40",
              !callUrl && "opacity-60"
            )}
          >
            <Phone className="h-4 w-4" />
          </a>
          <a
            href={messageUrl ?? "#"}
            onClick={messageUrl ? undefined : handleUnavailable}
            target={messageUrl ? "_blank" : undefined}
            rel={messageUrl ? "noopener noreferrer" : undefined}
            aria-label="Message rider"
            title="Message rider on WhatsApp"
            className={cn(
              "grid h-10 w-10 place-items-center rounded-full border border-gray-200 text-ink-muted transition-colors hover:border-brand-primary hover:text-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40",
              !messageUrl && "opacity-60"
            )}
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft">ETA</p>
          <p className="text-lg font-bold text-brand-primary">{eta} mins</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft">
            Distance
          </p>
          <p className="text-lg font-bold text-ink">{distance} km</p>
        </div>
      </div>

      <p className="mt-4 text-center text-xs font-medium text-ink-muted">
        Order #{order.id}
      </p>
    </div>
  );
});
