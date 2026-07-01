"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Heart,
  Wallet,
  CreditCard,
  Gift,
  HelpCircle,
  Star,
  Package,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";
import { toast } from "@/lib/stores/toast";

const menu = [
  { label: "My Orders", icon: Package, href: "/orders" },
  { label: "Wishlist", icon: Heart, href: "/wishlist" },
  { label: "Wallet", icon: Wallet, href: "/wallet" },
  { label: "Payment Methods", icon: CreditCard, href: "#" },
  { label: "Refer Friends", icon: Gift, href: "#" },
  { label: "Help Center", icon: HelpCircle, href: "#" },
  { label: "Rate App", icon: Star, href: "#" },
];

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const hydrated = useHydrated();

  if (hydrated && !user) {
    router.replace("/login?redirect=/profile");
    return null;
  }

  return (
    <div className="container-page max-w-2xl space-y-5 py-6">
      <div className="flex items-center gap-4 rounded-2xl border border-gray-100 p-5 shadow-card">
        <span className="relative h-16 w-16 overflow-hidden rounded-full bg-brand-surface">
          {user?.avatar ? (
            <Image src={user.avatar} alt={user.name} fill className="object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-brand-primary">
              <UserIcon className="h-7 w-7" />
            </span>
          )}
        </span>
        <div>
          <h1 className="text-xl font-bold text-ink">{user?.name ?? "Guest"}</h1>
          <p className="text-sm text-ink-muted">+91 {user?.phone}</p>
          {user?.email && (
            <p className="text-sm text-ink-soft">{user.email}</p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
        {menu.map(({ label, icon: Icon, href }, i) => (
          <Link
            key={label}
            href={href}
            onClick={(e) => {
              if (href === "#") {
                e.preventDefault();
                toast.info(`${label} is coming soon`);
              }
            }}
            className={`flex items-center gap-3 px-5 py-4 transition-colors hover:bg-gray-50 ${
              i !== 0 ? "border-t border-gray-100" : ""
            }`}
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-surface text-brand-primary">
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-medium text-ink">{label}</span>
            <ChevronRight className="h-4 w-4 text-ink-soft" />
          </Link>
        ))}
      </div>

      <button
        onClick={() => {
          logout();
          toast.success("Logged out");
          router.push("/");
        }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-secondary/30 py-3 text-sm font-semibold text-brand-secondary hover:bg-brand-secondary/5"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  );
}
