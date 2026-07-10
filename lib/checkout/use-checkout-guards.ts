"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/stores/cart";
import { useCheckoutStore } from "@/lib/stores/checkout";
import { useHydrated } from "@/lib/useHydrated";

export function useRequireCart() {
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);

  useEffect(() => {
    if (hydrated && items.length === 0) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, router]);

  return { hydrated, hasItems: items.length > 0 };
}

export function useRequireAddress() {
  const router = useRouter();
  const hydrated = useHydrated();
  const deliveryAddress = useCheckoutStore((s) => s.deliveryAddress);
  const { hasItems } = useRequireCart();

  useEffect(() => {
    if (hydrated && hasItems && !deliveryAddress) {
      router.replace("/checkout/address");
    }
  }, [hydrated, hasItems, deliveryAddress, router]);

  return { hydrated, hasAddress: Boolean(deliveryAddress) };
}
