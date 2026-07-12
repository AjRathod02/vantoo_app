"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Facebook,
  Gift,
  Instagram,
  Link2,
  MessageCircle,
  Send,
  Share2,
  Users,
  Wallet,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/lib/stores/toast";
import type { ReferralDashboard } from "@/lib/referral/types";

function statusTone(
  status: string
): "orange" | "red" | "green" | "gray" {
  if (status === "completed") return "green";
  if (status === "rejected" || status === "ineligible") return "red";
  if (status === "ordered" || status === "pending") return "orange";
  return "gray";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    signed_up: "Pending",
    ordered: "Pending",
    pending: "Pending",
    completed: "Completed",
    rejected: "Rejected",
    ineligible: "Rejected",
  };
  return map[status] ?? status;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ReferEarnPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useHydrated();
  const [dashboard, setDashboard] = useState<ReferralDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/referrals");
    if (res.status === 401) {
      router.replace("/login?redirect=/refer");
      return;
    }
    const data = await res.json();
    setDashboard(data.dashboard ?? null);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login?redirect=/refer");
      return;
    }
    load();
  }, [hydrated, user, router, load]);

  const copyText = async (text: string, kind: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success(kind === "code" ? "Code copied" : "Link copied");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  const shareMessage = dashboard
    ? `Join me on Vantoo! Use my code ${dashboard.code} and get fast delivery. ${dashboard.link}`
    : "";

  const openShare = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!hydrated || (!user && loading)) return null;

  return (
    <div className="container-page max-w-2xl space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Refer & Earn</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Invite friends and earn commission on their first order.
        </p>
      </div>

      {loading || !dashboard ? (
        <p className="text-ink-muted">Loading your referral dashboard...</p>
      ) : !dashboard.programEnabled ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-card">
          <Gift className="mx-auto h-10 w-10 text-ink-soft" />
          <p className="mt-3 font-semibold text-ink">Referral program is paused</p>
          <p className="mt-1 text-sm text-ink-muted">
            Check back later — we&apos;ll reopen invites soon.
          </p>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary to-brand-primaryLight p-6 text-white shadow-card">
            <Gift className="absolute -right-3 -top-3 h-28 w-28 text-white/10" />
            <p className="text-sm text-white/80">Available Referral Balance</p>
            <p className="mt-1 text-4xl font-extrabold">
              {formatINR(dashboard.stats.availableBalance)}
            </p>
            <p className="mt-2 text-sm text-white/80">
              Lifetime earned {formatINR(dashboard.stats.totalEarnings)}
            </p>
            <Button
              variant="secondary"
              className="mt-4 bg-white"
              onClick={() => router.push("/wallet")}
            >
              <Wallet className="h-4 w-4" />
              Open Wallet
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Total Friends Referred",
                value: dashboard.stats.totalReferrals,
                icon: Users,
              },
              {
                label: "First Orders",
                value: dashboard.stats.friendsFirstOrder,
                icon: Share2,
              },
              {
                label: "Successful",
                value: dashboard.stats.successfulReferrals,
                icon: Gift,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card"
              >
                <Icon className="h-4 w-4 text-brand-primary" />
                <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
                <p className="text-xs text-ink-muted">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                Your Referral Code
              </p>
              <div className="mt-2 flex items-center gap-2">
                <p className="flex-1 font-mono text-2xl font-bold tracking-widest text-brand-primary">
                  {dashboard.code}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyText(dashboard.code, "code")}
                >
                  {copied === "code" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  Copy
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
                Your Referral Link
              </p>
              <p className="mt-2 break-all text-sm text-ink">{dashboard.link}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyText(dashboard.link, "link")}
                >
                  {copied === "link" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Copy Link
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    openShare(
                      `https://wa.me/?text=${encodeURIComponent(shareMessage)}`
                    )
                  }
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    openShare(
                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(dashboard.link)}&quote=${encodeURIComponent(shareMessage)}`
                    )
                  }
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    openShare(
                      `https://t.me/share/url?url=${encodeURIComponent(dashboard.link)}&text=${encodeURIComponent(shareMessage)}`
                    )
                  }
                >
                  <Send className="h-4 w-4" />
                  Telegram
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    openShare(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`
                    )
                  }
                >
                  <Share2 className="h-4 w-4" />
                  X
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareMessage);
                      toast.success("Caption copied — paste in Instagram");
                    } catch {
                      toast.error("Could not copy");
                    }
                  }}
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-brand-surface/60 p-5">
            <h2 className="font-bold text-ink">Referral Rules</h2>
            <p className="mt-2 text-sm text-ink-muted">{dashboard.rules.description}</p>
            <p className="mt-3 text-sm font-medium text-ink">First Order Reward</p>
            <p className="mt-1 text-sm text-ink-muted">{dashboard.rules.example}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">
              <li>Referred user must be a new customer</li>
              <li>Reward applies only on the first successful order</li>
              <li>
                Minimum order value ₹{dashboard.rules.minOrderAmount} (after
                discounts)
              </li>
              <li>Order must be delivered — cancelled, failed, refunded, or returned orders are not eligible</li>
              <li>Commission credits only after the order is marked Delivered</li>
            </ul>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Referral History</h2>
              <p className="text-xs text-ink-soft">
                {dashboard.stats.pendingReferrals} pending
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
              {dashboard.history.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-ink-muted">
                  No referrals yet. Share your code to get started.
                </p>
              ) : (
                dashboard.history.map((item, i) => (
                  <div
                    key={item.id}
                    className={`px-4 py-3.5 ${i !== 0 ? "border-t border-gray-100" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {item.friendName}
                        </p>
                        <p className="text-xs text-ink-soft">
                          Joined {formatDate(item.referralDate)}
                        </p>
                      </div>
                      <Badge tone={statusTone(item.status)}>
                        {statusLabel(item.status)}
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-ink-muted">
                      <div>
                        <p className="text-ink-soft">First order</p>
                        <p className="font-medium text-ink">
                          {item.firstOrderAmount != null
                            ? formatINR(item.firstOrderAmount)
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-ink-soft">Commission</p>
                        <p className="font-medium text-ink">
                          {item.commissionEarned != null
                            ? formatINR(item.commissionEarned)
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-ink-soft">Credited</p>
                        <p className="font-medium text-ink">
                          {formatDate(item.rewardCreditedDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {dashboard.walletTransactions.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-bold text-ink">
                Referral Earnings History
              </h2>
              <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
                {dashboard.walletTransactions.map((t, i) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between px-4 py-3.5 ${
                      i !== 0 ? "border-t border-gray-100" : ""
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{t.title}</p>
                      <p className="text-xs text-ink-soft">{formatDate(t.date)}</p>
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
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
