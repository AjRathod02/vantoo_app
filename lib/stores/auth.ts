"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Address, User } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

interface AuthState {
  user: User | null;
  addresses: Address[];
  loading: boolean;
  syncSession: () => Promise<User | null>;
  login: (email: string, password: string) => Promise<User>;
  signup: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<{ user?: User; needsEmailConfirmation?: boolean; message?: string }>;
  logout: () => Promise<void>;
  addAddress: (address: Address) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  removeAddress: (id: string) => void;
}

function mapUser(
  authUser: { id: string; email?: string; user_metadata?: Record<string, string> },
  profile?: { name?: string; phone?: string; role?: string } | null
): User {
  return {
    id: authUser.id,
    name: profile?.name || authUser.user_metadata?.name || "Vantoo User",
    phone: profile?.phone || authUser.user_metadata?.phone || "",
    email: authUser.email,
    role: profile?.role === "admin" ? "admin" : "customer",
  };
}

async function fetchProfile(userId: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("name, phone, role")
      .eq("id", userId)
      .maybeSingle();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      addresses: [],
      loading: false,
      syncSession: async () => {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          set({ user: null });
          return null;
        }
        const profile = await fetchProfile(user.id);
        const mapped = mapUser(user, profile);
        set({ user: mapped });
        return mapped;
      },
      login: async (email, password) => {
        set({ loading: true });
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error ?? "Login failed");
          }
          set({ user: data.user, loading: false });
          return data.user as User;
        } catch (e) {
          set({ loading: false });
          throw e;
        }
      },
      signup: async ({ name, email, phone, password }) => {
        set({ loading: true });
        try {
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, phone, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error ?? "Signup failed");
          }
          if (data.needsEmailConfirmation) {
            set({ loading: false });
            return {
              needsEmailConfirmation: true,
              message: data.message,
            };
          }
          set({ user: data.user, loading: false });
          return { user: data.user as User };
        } catch (e) {
          set({ loading: false });
          throw e;
        }
      },
      logout: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ user: null });
      },
      addAddress: (address) =>
        set((state) => ({ addresses: [...state.addresses, address] })),
      updateAddress: (id, patch) =>
        set((state) => ({
          addresses: state.addresses.map((a) =>
            a.id === id ? { ...a, ...patch } : a
          ),
        })),
      removeAddress: (id) =>
        set((state) => ({
          addresses: state.addresses.filter((a) => a.id !== id),
        })),
    }),
    { name: "vantoo-auth", partialize: (s) => ({ addresses: s.addresses }) }
  )
);
