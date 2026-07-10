"use client";

import { cn } from "@/lib/utils";
import { CHECKOUT_STEPS, type CheckoutStep } from "@/lib/checkout/constants";

export function CheckoutProgress({ currentStep }: { currentStep: CheckoutStep }) {
  const currentIndex = CHECKOUT_STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex min-w-max items-center gap-1 sm:gap-2">
        {CHECKOUT_STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium sm:gap-2 sm:px-3 sm:text-sm",
                i <= currentIndex
                  ? "bg-brand-surface text-ink"
                  : "text-ink-soft"
              )}
            >
              <span aria-hidden>{step.emoji}</span>
              <span className={cn(i === currentIndex && "font-semibold")}>
                {step.label}
              </span>
            </div>
            {i < CHECKOUT_STEPS.length - 1 && (
              <span
                className={cn(
                  "mx-1 text-xs sm:mx-2",
                  i < currentIndex ? "text-brand-primary" : "text-ink-soft"
                )}
                aria-hidden
              >
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
