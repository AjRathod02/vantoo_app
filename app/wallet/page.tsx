"use client";

import { ArrowDownLeft, ArrowUpRight, Plus, Wallet as WalletIcon } from "lucide-react";
import type { WalletTransaction } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";

const balance = 1240;

const transactions: WalletTransaction[] = [
  { id: "t-1", title: "Cashback - Order #VT00184", amount: 48, type: "credit", date: "Today, 2:14 PM" },
  { id: "t-2", title: "Paid for Grocery order", amount: 320, type: "debit", date: "Yesterday, 6:40 PM" },
  { id: "t-3", title: "Added money to wallet", amount: 500, type: "credit", date: "12 Jun, 11:02 AM" },
  { id: "t-4", title: "Paid for Food order", amount: 279, type: "debit", date: "10 Jun, 8:25 PM" },
  { id: "t-5", title: "Referral bonus", amount: 100, type: "credit", date: "8 Jun, 3:00 PM" },
];

export default function WalletPage() {
  return (
    <div className="container-page max-w-2xl space-y-6 py-6">
      <h1 className="text-2xl font-bold text-ink">Vantoo Wallet</h1>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-primary to-brand-primaryLight p-6 text-white shadow-card">
        <WalletIcon className="absolute -right-4 -top-4 h-28 w-28 text-white/10" />
        <p className="text-sm text-white/80">Available Balance</p>
        <p className="mt-1 text-4xl font-extrabold">{formatINR(balance)}</p>
        <Button
          variant="secondary"
          className="mt-4 bg-white"
          onClick={() => toast.info("Add money is mocked in this demo")}
        >
          <Plus className="h-4 w-4" />
          Add Money
        </Button>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-ink">Recent Transactions</h2>
        <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
          {transactions.map((t, i) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
