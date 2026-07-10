"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/stores/cart";
import { useCheckoutStore } from "@/lib/stores/checkout";
import { CheckoutShell } from "@/components/checkout/CheckoutShell";
import { Button } from "@/components/ui/Button";
import { paymentOptions } from "@/lib/checkout/constants";
import { useRequireAddress } from "@/lib/checkout/use-checkout-guards";

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { hydrated, hasAddress } = useRequireAddress();
  const totals = useCartStore((s) => s.totals());
  const payment = useCheckoutStore((s) => s.payment);
  const setPayment = useCheckoutStore((s) => s.setPayment);

  if (!hydrated || !hasAddress) return null;

  return (
    <CheckoutShell title="Payment Method" currentStep="payment" totals={totals}>
      <div className="space-y-3">
        {paymentOptions.map(({ id, label, desc, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setPayment(id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
              payment === id
                ? "border-brand-primary bg-brand-surface"
                : "border-gray-200 hover:border-brand-primary/40"
            )}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-primary shadow-sm">
              <Icon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{label}</p>
              <p className="text-xs text-ink-muted">{desc}</p>
            </div>
          </button>
        ))}
        <p className="text-xs text-ink-soft">
          By placing an order you agree to our{" "}
          <Link href="/policies/refund" className="text-brand-primary">
            Refund
          </Link>{" "}
          and{" "}
          <Link href="/policies/cancellation" className="text-brand-primary">
            Cancellation
          </Link>{" "}
          policies.
        </p>
      </div>

      <div className="flex gap-3">
        <Link href="/checkout/address">
          <Button variant="outline">Back</Button>
        </Link>
        <Button className="flex-1" onClick={() => router.push("/checkout/review")}>
          Continue
        </Button>
      </div>
    </CheckoutShell>
  );
}
