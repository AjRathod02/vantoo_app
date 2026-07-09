"use client";

import { Check, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

export function OrderPlacedBanner({
  orderId,
  className,
}: {
  orderId: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-card",
        className
      )}
    >
      <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
        <span className="relative mb-4 grid h-16 w-16 shrink-0 place-items-center rounded-full bg-green-500 text-white shadow-lg sm:mb-0 sm:mr-5">
          <Check className="h-8 w-8" strokeWidth={3} />
          <PartyPopper className="absolute -right-1 -top-1 h-5 w-5 text-amber-500" />
        </span>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-ink sm:text-2xl">
            Congratulations! Your order is confirmed
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            We&apos;ve received your order and will start preparing it shortly.
          </p>
          <div className="mt-4 inline-flex flex-col items-center rounded-xl border border-green-200 bg-white px-5 py-3 sm:items-start">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">
              Order ID
            </span>
            <span className="mt-0.5 font-mono text-lg font-bold text-brand-primary">
              #{orderId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
