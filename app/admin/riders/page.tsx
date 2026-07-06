"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { RiderProfile } from "@/lib/platform/riders";

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/riders?status=${filter}`)
      .then((r) => r.json())
      .then((d) => setRiders(d.riders ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleAction(riderId: string, action: "approve" | "reject") {
    setActionId(riderId);
    const reason = action === "reject" ? prompt("Rejection reason:") : undefined;
    if (action === "reject" && !reason) { setActionId(null); return; }

    await fetch("/api/admin/riders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, riderId, reason }),
    });
    setActionId(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Rider Applications</h1>
        <p className="text-sm text-ink-muted">Review and approve rider onboarding requests.</p>
      </div>

      <div className="flex gap-2">
        {["pending", "under_review", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
              filter === s ? "bg-brand-primary text-white" : "bg-gray-100 text-ink-muted"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-muted">Loading...</p>
      ) : riders.length === 0 ? (
        <p className="text-ink-muted">No riders in this category.</p>
      ) : (
        <div className="space-y-4">
          {riders.map((r) => (
            <div key={r.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-ink">{r.fullName}</h2>
                  <p className="text-sm text-ink-muted">{r.email} · {r.phone}</p>
                  <p className="mt-1 text-xs capitalize text-ink-muted">
                    {r.vehicleType.replace("_", " ")} · {r.city}
                  </p>
                  <p className="text-xs text-ink-muted">Applied {new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                </div>
                <Badge tone={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "orange"}>
                  {r.status.replace("_", " ")}
                </Badge>
              </div>
              {(r.status === "pending" || r.status === "under_review") && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" disabled={actionId === r.id} onClick={() => handleAction(r.id, "approve")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={actionId === r.id} onClick={() => handleAction(r.id, "reject")}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
