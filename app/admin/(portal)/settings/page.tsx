"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";

interface CancellationPolicy {
  id: string;
  user_type: string;
  free_cancellation_minutes: number;
  cancellation_charge_percent: number;
  refund_percent: number;
  penalty_amount: number;
}

export default function AdminSettingsPage() {
  const [policies, setPolicies] = useState<CancellationPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setPolicies(d.settings?.cancellationPolicies ?? []))
      .finally(() => setLoading(false));
  }, []);

  const savePolicy = async (policy: CancellationPolicy) => {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cancellationPolicy: {
          userType: policy.user_type,
          freeCancellationMinutes: policy.free_cancellation_minutes,
          cancellationChargePercent: policy.cancellation_charge_percent,
          refundPercent: policy.refund_percent,
          penaltyAmount: policy.penalty_amount,
        },
      }),
    });
    if (res.ok) {
      toast.success("Policy updated");
    } else {
      toast.error("Update failed");
    }
  };

  return (
    <>
      <AdminHeader title="Settings" subtitle="Cancellation policies and system configuration" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-ink">Cancellation Policies</h2>
          {loading ? (
            <p className="text-ink-muted">Loading...</p>
          ) : (
            <div className="space-y-4">
              {policies.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card"
                >
                  <h3 className="mb-3 font-medium capitalize text-ink">{p.user_type}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-sm">
                      <span className="text-ink-muted">Free cancellation (min)</span>
                      <input
                        type="number"
                        value={p.free_cancellation_minutes}
                        onChange={(e) =>
                          setPolicies((prev) =>
                            prev.map((x) =>
                              x.id === p.id
                                ? { ...x, free_cancellation_minutes: +e.target.value }
                                : x
                            )
                          )
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-gray-200 px-3"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="text-ink-muted">Charge %</span>
                      <input
                        type="number"
                        value={p.cancellation_charge_percent}
                        onChange={(e) =>
                          setPolicies((prev) =>
                            prev.map((x) =>
                              x.id === p.id
                                ? { ...x, cancellation_charge_percent: +e.target.value }
                                : x
                            )
                          )
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-gray-200 px-3"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="text-ink-muted">Refund %</span>
                      <input
                        type="number"
                        value={p.refund_percent}
                        onChange={(e) =>
                          setPolicies((prev) =>
                            prev.map((x) =>
                              x.id === p.id ? { ...x, refund_percent: +e.target.value } : x
                            )
                          )
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-gray-200 px-3"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="text-ink-muted">Penalty (₹)</span>
                      <input
                        type="number"
                        value={p.penalty_amount}
                        onChange={(e) =>
                          setPolicies((prev) =>
                            prev.map((x) =>
                              x.id === p.id ? { ...x, penalty_amount: +e.target.value } : x
                            )
                          )
                        }
                        className="mt-1 h-10 w-full rounded-xl border border-gray-200 px-3"
                      />
                    </label>
                  </div>
                  <Button size="sm" className="mt-4" onClick={() => savePolicy(p)}>
                    Save Policy
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
