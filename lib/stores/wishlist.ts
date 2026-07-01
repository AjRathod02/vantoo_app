"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/types";

interface WishlistState {
  items: Product[];
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) =>
        set((state) => {
          const exists = state.items.some((i) => i.id === product.id);
          return {
            items: exists
              ? state.items.filter((i) => i.id !== product.id)
              : [...state.items, product],
          };
        }),
      remove: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== productId),
        })),
      has: (productId) => get().items.some((i) => i.id === productId),
    }),
    { name: "vantoo-wishlist" }
  )
);
