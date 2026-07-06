"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";

interface Earning {
  id: string;
  amount: number;
  earningType: string;
  status: string;
  createdAt: string;
}

export default function RiderEarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rider/earnings")
      .then((r) => (r.ok ? r.json() : { earnings: [] }))
      .then((d) => setEarnings(d.earnings ?? []))
      .finally(() => setLoading(false));
  }, []);

  const total = earnings.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Earnings</h1>
        <p className="text-sm text-ink-muted">Delivery fees from completed orders.</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
        <p className="text-sm text-ink-muted">Total shown</p>
        <p className="text-3xl font-bold text-ink">{formatINR(total)}</p>
      </div>

      {loading ? (
        <p className="text-ink-muted">Loading...</p>
      ) : earnings.length === 0 ? (
        <p className="text-ink-muted">No earnings yet. Complete deliveries to start earning.</p>
      ) : (
        <div className="space-y-3">
          {earnings.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-medium capitalize text-ink">{e.earningType.replace("_", " ")}</p>
                <p className="text-xs text-ink-muted">{new Date(e.createdAt).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-ink">{formatINR(Number(e.amount))}</p>
                <p className="text-xs capitalize text-ink-muted">{e.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
