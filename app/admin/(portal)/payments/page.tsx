"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatCard } from "@/components/admin/StatCard";
import { IndianRupee, CreditCard, AlertTriangle, TrendingUp } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface PaymentSummary {
  totalRevenue: number;
  totalTransactions: number;
  failedPayments: number;
  pendingPayouts: number;
  vendorEarnings: number;
  riderEarnings: number;
  commissionRevenue: number;
}

export default function AdminPaymentsPage() {
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [byMethod, setByMethod] = useState<{ method: string; count: number; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((d) => {
        setSummary(d.summary);
        setByMethod(d.byMethod ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <AdminHeader title="Payments" subtitle="Revenue, payouts, and transaction management" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <p className="text-ink-muted">Loading payments...</p>
        ) : summary ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Revenue" value={formatINR(summary.totalRevenue)} icon={IndianRupee} />
              <StatCard label="Transactions" value={summary.totalTransactions} icon={CreditCard} />
              <StatCard label="Failed Payments" value={summary.failedPayments} icon={AlertTriangle} />
              <StatCard label="Pending Payouts" value={summary.pendingPayouts} icon={TrendingUp} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Vendor Earnings" value={formatINR(summary.vendorEarnings)} icon={IndianRupee} />
              <StatCard label="Rider Earnings" value={formatINR(summary.riderEarnings)} icon={IndianRupee} />
              <StatCard label="Commission" value={formatINR(summary.commissionRevenue)} icon={TrendingUp} />
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
              <h3 className="mb-4 font-semibold text-ink">Payment Methods</h3>
              <div className="space-y-2">
                {byMethod.map((m) => (
                  <div key={m.method} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <span className="font-medium uppercase text-ink">{m.method}</span>
                    <span className="text-sm text-ink-muted">
                      {m.count} txns · {formatINR(m.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
