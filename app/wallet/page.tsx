"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Plus,
  Wallet as WalletIcon,
} from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";

interface WalletTx {
  id: string;
  title: string;
  amount: number;
  type: "credit" | "debit";
  date: string;
  status?: string;
}

export default function WalletPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useHydrated();
  const [balance, setBalance] = useState(0);
  const [lifetime, setLifetime] = useState(0);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login?redirect=/wallet");
      return;
    }

    fetch("/api/referrals/wallet")
      .then((r) => r.json())
      .then((d) => {
        setBalance(Number(d.wallet?.balance ?? 0));
        setLifetime(Number(d.wallet?.lifetimeEarned ?? 0));
        setTransactions(
          (d.wallet?.transactions ?? []).map(
            (t: {
              id: string;
              title: string;
              amount: number;
              type: "credit" | "debit";
              date: string;
              status: string;
            }) => ({
              id: t.id,
              title: t.title,
              amount: t.amount,
              type: t.type,
              date: new Date(t.date).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              }),
              status: t.status,
            })
          )
        );
      })
      .finally(() => setLoading(false));
  }, [hydrated, user, router]);

  if (!hydrated || !user) return null;

  return (
    <div className="container-page max-w-2xl space-y-6 py-6">
      <h1 className="text-2xl font-bold text-ink">Vantoo Wallet</h1>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary to-brand-primaryLight p-6 text-white shadow-card">
        <WalletIcon className="absolute -right-4 -top-4 h-28 w-28 text-white/10" />
        <p className="text-sm text-white/80">Referral Wallet Balance</p>
        <p className="mt-1 text-4xl font-extrabold">
          {loading ? "…" : formatINR(balance)}
        </p>
        <p className="mt-2 text-sm text-white/80">
          Lifetime referral earnings {formatINR(lifetime)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="bg-white"
            onClick={() =>
              toast.info("Referral balance can be used on checkout soon")
            }
          >
            <Plus className="h-4 w-4" />
            Use on Purchase
          </Button>
          <Link href="/refer">
            <Button variant="secondary" className="border-white/40 bg-white/15 text-white hover:bg-white/25">
              <Gift className="h-4 w-4" />
              Refer & Earn
            </Button>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-ink">Referral Earnings</h2>
        <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
          {loading ? (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">
              No referral earnings yet.{" "}
              <Link href="/refer" className="font-semibold text-brand-primary">
                Invite friends
              </Link>{" "}
              to start earning.
            </p>
          ) : (
            transactions.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  i !== 0 ? "border-t border-gray-100" : ""
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-full ${
                    t.type === "credit"
                      ? "bg-brand-accent/15 text-green-700"
                      : "bg-brand-secondary/10 text-brand-secondary"
                  }`}
                >
                  {t.type === "credit" ? (
                    <ArrowDownLeft className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{t.title}</p>
                  <p className="text-xs text-ink-soft">{t.date}</p>
                </div>
                <span
                  className={`text-sm font-bold ${
                    t.type === "credit" ? "text-green-700" : "text-ink"
                  }`}
                >
                  {t.type === "credit" ? "+" : "-"}
                  {formatINR(t.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
