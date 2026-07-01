"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Address, User } from "@/lib/types";
import { addresses as seedAddresses } from "@/lib/data/addresses";

interface AuthState {
  user: User | null;
  addresses: Address[];
  login: (phone: string) => Promise<User>;
  logout: () => void;
  addAddress: (address: Address) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      addresses: seedAddresses,
      login: async (phone) => {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        set({ user: data.user });
        return data.user as User;
      },
      logout: () => {
        fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        set({ user: null });
      },
      addAddress: (address) =>
        set((state) => ({ addresses: [...state.addresses, address] })),
    }),
    { name: "vantoo-auth" }
  )
);
