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
  getTrackingSteps,
  getStepIndex,
  statusMeta,
} from "@/lib/orderStatus";

export const OrderTrackingTimeline = memo(function OrderTrackingTimeline({
  status,
  className,
}: {
  status: Order["status"];
  className?: string;
}) {
  const steps = getTrackingSteps();
  const currentIndex =
    status === "cancelled" ? -1 : getStepIndex(status);

  return (
    <ol className={cn("space-y-0", className)}>
      {steps.map((step, i) => {
        const done = i <= currentIndex;
        const active = i === currentIndex;
        const meta = statusMeta[step];

        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <motion.span
                layout
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full border-2 transition-colors",
                  done
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-gray-300 bg-white text-ink-soft",
                  active && "ring-4 ring-brand-primary/20"
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-gray-300" />
                )}
              </motion.span>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "my-1 h-8 w-0.5",
                    i < currentIndex ? "bg-brand-primary" : "bg-gray-200"
                  )}
                />
              )}
            </div>
            <div className="pb-6 pt-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  done ? "text-ink" : "text-ink-soft"
                )}
              >
                {meta.label}
              </p>
              <p className="text-xs text-ink-soft">{meta.description}</p>
            </div>
          </li>
        );
      })}
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
