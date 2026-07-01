"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/lib/types";

const PROMO_CODES: Record<string, number> = {
  SAVE10: 0.1,
  VANTOO20: 0.2,
};

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  applyPromo: (code: string) => boolean;
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
}

export const DELIVERY_FEE = 40;
export const TAX_RATE = 0.05;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      addItem: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        })),
      updateQty: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.product.id !== productId)
              : state.items.map((i) =>
                  i.product.id === productId ? { ...i, quantity } : i
                ),
        })),
      applyPromo: (code) => {
        const normalized = code.trim().toUpperCase();
        if (PROMO_CODES[normalized]) {
          set({ promoCode: normalized });
          return true;
        }
        return false;
      },
      clearPromo: () => set({ promoCode: null }),
      clearCart: () => set({ items: [], promoCode: null }),
      totals: () => {
        const { items, promoCode } = get();
        const subtotal = items.reduce(
          (sum, i) => sum + i.product.price * i.quantity,
          0
        );
        const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
        const discount = promoCode
          ? Math.round(subtotal * (PROMO_CODES[promoCode] ?? 0))
          : 0;
        const taxable = Math.max(subtotal - discount, 0);
        const tax = Math.round(taxable * TAX_RATE);
        const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0;
        const total = taxable + tax + deliveryFee;
        return { subtotal, deliveryFee, tax, discount, total, itemCount };
      },
    }),
    { name: "vantoo-cart" }
  )
);
