"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingCart, Trash2, Tag, X } from "lucide-react";
import { useCartStore } from "@/lib/stores/cart";
import { useHydrated } from "@/lib/useHydrated";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { OrderSummary } from "@/components/OrderSummary";
import { CheckoutProgress } from "@/components/checkout/CheckoutProgress";
import { toast } from "@/lib/stores/toast";

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const applyPromoAsync = useCartStore((s) => s.applyPromoAsync);
  const clearPromo = useCartStore((s) => s.clearPromo);
  const promoCode = useCartStore((s) => s.promoCode);
  const totals = useCartStore((s) => s.totals());
  const hydrated = useHydrated();
  const [promo, setPromo] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);

  if (!hydrated) return null;

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
        <ShoppingCart className="h-14 w-14 text-ink-soft" />
        <div>
          <p className="text-lg font-semibold text-ink">Your cart is empty</p>
          <p className="text-sm text-ink-muted">
            Add items from food, grocery, medicine or shopping.
          </p>
        </div>
        <Link href="/">
          <Button>Browse Vantoo</Button>
        </Link>
      </div>
    );
  }

  const onApplyPromo = async () => {
    setApplyingPromo(true);
    try {
      const ok = await applyPromoAsync(promo, totals.subtotal);
      if (ok) {
        toast.success("Promo code applied!");
        setPromo("");
      } else {
        toast.error("Invalid promo code");
      }
    } finally {
      setApplyingPromo(false);
    }
  };

  return (
    <div className="container-page py-6">
      <h1 className="mb-5 text-2xl font-bold text-ink">My Cart</h1>
      <CheckoutProgress currentStep="cart" />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="flex gap-4 rounded-2xl border border-gray-100 p-3 shadow-card"
            >
              <Link
                href={`/product/${product.id}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50"
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      {product.name}
                    </h3>
                    <p className="text-xs text-ink-soft">
                      {product.brand}
                      {product.unit ? ` · ${product.unit}` : ""}
                    </p>
                  </div>
                  <button
                    aria-label="Remove item"
                    onClick={() => {
                      removeItem(product.id);
                      toast.success("Item removed");
                    }}
                    className="rounded-lg p-1.5 text-ink-soft hover:bg-gray-100 hover:text-brand-secondary"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <QuantityStepper
                    size="sm"
                    value={quantity}
                    onChange={(n) => updateQty(product.id, n)}
                  />
                  <span className="font-bold text-ink">
                    {formatINR(product.price * quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-gray-100 p-5 shadow-card lg:sticky lg:top-32">
          <h2 className="text-lg font-bold text-ink">Order Summary</h2>

          {promoCode ? (
            <div className="flex items-center justify-between rounded-xl bg-brand-accent/10 px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-2 font-medium text-green-700">
                <Tag className="h-4 w-4" />
                {promoCode} applied
              </span>
              <button
                onClick={() => {
                  clearPromo();
                  toast.info("Promo removed");
                }}
                aria-label="Remove promo"
              >
                <X className="h-4 w-4 text-green-700" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="Promo code (try SAVE10)"
                className="h-10 flex-1 rounded-xl border border-gray-300 px-3 text-sm focus:border-brand-primary focus:outline-none"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={onApplyPromo}
                disabled={applyingPromo || !promo.trim()}
              >
                {applyingPromo ? "…" : "Apply"}
              </Button>
            </div>
          )}

          <OrderSummary {...totals} />

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Link href="/checkout/address" className="flex-1">
              <Button size="lg" fullWidth>
                Continue
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
