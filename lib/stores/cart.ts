"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/lib/types";
import { DELIVERY_FEE, TAX_RATE } from "@/lib/commerce/constants";

const PROMO_CODES: Record<string, number> = {
  SAVE10: 0.1,
  VANTOO20: 0.2,
};

export interface CartSummary {
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  grandTotal: number;
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
  updatedAt: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  applyPromo: (code: string) => boolean;
  applyPromoAsync: (code: string, subtotal: number) => Promise<boolean>;
  clearPromo: () => void;
  clearCart: () => void;
  totals: () => {
    subtotal: number;
    deliveryFee: number;
    tax: number;
    discount: number;
    total: number;
    itemCount: number;
  };
  summary: () => CartSummary;
}

export function computeCartSummary(
  items: CartItem[],
  promoCode: string | null,
  promoDiscount = 0
): CartSummary {
  const subtotal = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const discount =
    promoDiscount > 0
      ? Math.min(Math.round(promoDiscount), Math.round(subtotal))
      : promoCode
        ? Math.round(subtotal * (PROMO_CODES[promoCode] ?? 0))
        : 0;
  const taxable = Math.max(subtotal - discount, 0);
  const tax = Math.round(taxable * TAX_RATE);
  const deliveryCharge = subtotal > 0 ? DELIVERY_FEE : 0;
  const grandTotal = taxable + tax + deliveryCharge;

  return {
    totalItems,
    totalQuantity,
    subtotal,
    discount,
    deliveryCharge,
    grandTotal,
  };
}

export { DELIVERY_FEE, TAX_RATE } from "@/lib/commerce/constants";

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      promoDiscount: 0,
      updatedAt: 0,
      addItem: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              updatedAt: Date.now(),
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return {
            updatedAt: Date.now(),
            items: [...state.items, { product, quantity }],
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          updatedAt: Date.now(),
          items: state.items.filter((i) => i.product.id !== productId),
        })),
      updateQty: (productId, quantity) =>
        set((state) => {
          const existing = state.items.find((i) => i.product.id === productId);
          const increased = existing ? quantity > existing.quantity : quantity > 0;

          return {
            ...(increased ? { updatedAt: Date.now() } : {}),
            items:
              quantity <= 0
                ? state.items.filter((i) => i.product.id !== productId)
                : state.items.map((i) =>
                    i.product.id === productId ? { ...i, quantity } : i
                  ),
          };
        }),
      applyPromo: (code) => {
        const normalized = code.trim().toUpperCase();
        if (PROMO_CODES[normalized]) {
          set({
            promoCode: normalized,
            promoDiscount: 0,
            updatedAt: Date.now(),
          });
          return true;
        }
        return false;
      },
      applyPromoAsync: async (code, subtotal) => {
        const normalized = code.trim().toUpperCase();
        try {
          const res = await fetch("/api/coupons/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: normalized, subtotal }),
          });
          if (res.ok) {
            const data = (await res.json()) as { discount?: number };
            set({
              promoCode: normalized,
              promoDiscount: Number(data.discount ?? 0),
              updatedAt: Date.now(),
            });
            return true;
          }
        } catch {
          // fall through to static codes
        }
        if (PROMO_CODES[normalized]) {
          set({
            promoCode: normalized,
            promoDiscount: Math.round(subtotal * PROMO_CODES[normalized]),
            updatedAt: Date.now(),
          });
          return true;
        }
        return false;
      },
      clearPromo: () =>
        set({ promoCode: null, promoDiscount: 0, updatedAt: Date.now() }),
      clearCart: () => set({ items: [], promoCode: null, promoDiscount: 0 }),
      totals: () => {
        const { items, promoCode, promoDiscount } = get();
        const summary = computeCartSummary(items, promoCode, promoDiscount);
        const taxable = Math.max(summary.subtotal - summary.discount, 0);
        const tax = Math.round(taxable * TAX_RATE);
        return {
          subtotal: summary.subtotal,
          deliveryFee: summary.deliveryCharge,
          tax,
          discount: summary.discount,
          total: summary.grandTotal,
          itemCount: summary.totalQuantity,
        };
      },
      summary: () => {
        const { items, promoCode, promoDiscount } = get();
        return computeCartSummary(items, promoCode, promoDiscount);
      },
    }),
    {
      name: "vantoo-cart",
      partialize: (state) => ({
        items: state.items,
        promoCode: state.promoCode,
        promoDiscount: state.promoDiscount,
      }),
    }
  )
);

export const selectCartSummary = (state: CartState): CartSummary =>
  state.summary();

export const selectCartItemCount = (state: CartState): number =>
  state.summary().totalQuantity;

export const selectHasCartItems = (state: CartState): boolean =>
  state.items.length > 0;
