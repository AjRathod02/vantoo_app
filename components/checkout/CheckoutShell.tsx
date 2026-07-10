"use client";

import type { ReactNode } from "react";
import { CheckoutProgress } from "@/components/checkout/CheckoutProgress";
import { OrderSummary } from "@/components/OrderSummary";
import type { CheckoutStep } from "@/lib/checkout/constants";

export function CheckoutShell({
  title,
  currentStep,
  totals,
  children,
}: {
  title: string;
  currentStep: CheckoutStep;
  totals: {
    subtotal: number;
    deliveryFee: number;
    tax: number;
    discount: number;
    total: number;
  };
  children: ReactNode;
}) {
  return (
    <div className="container-page py-6">
      <h1 className="mb-5 text-2xl font-bold text-ink">{title}</h1>
      <CheckoutProgress currentStep={currentStep} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">{children}</div>

        <aside className="h-fit space-y-4 rounded-2xl border border-gray-100 p-5 shadow-card lg:sticky lg:top-32">
          <h2 className="text-lg font-bold text-ink">Order Summary</h2>
          <OrderSummary {...totals} />
        </aside>
      </div>
    </div>
  );
}
