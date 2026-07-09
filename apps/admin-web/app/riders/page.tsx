"use client";

import { useCallback, useEffect, useState } from "react";

type Rider = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  vehicleType: string;
  city: string;
  status: string;
};

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/riders?status=${filter}`)
      .then((r) => r.json())
      .then((d) => setRiders(d.riders ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(riderId: string, action: "approve" | "reject") {
    const reason = action === "reject" ? prompt("Rejection reason:") : undefined;
    if (action === "reject" && !reason) return;
    await fetch("/api/admin/riders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, riderId, reason }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rider Applications</h1>
      <div className="flex gap-2">
        {["pending", "under_review", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-sm capitalize ${
              filter === s ? "bg-brand-primary text-white" : "bg-gray-100"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : riders.length === 0 ? (
        <p className="text-gray-500">No riders found.</p>
      ) : (
        <div className="space-y-4">
          {riders.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-white p-5">
              <div className="flex justify-between gap-4">
                <div>
                  <h2 className="font-bold">{r.fullName}</h2>
                  <p className="text-sm text-gray-500">
                    {r.email} · {r.phone} · {r.city}
                  </p>
                </div>
                <span className="text-sm capitalize">{r.status.replace("_", " ")}</span>
              </div>
              {(r.status === "pending" || r.status === "under_review") && (
                <div className="mt-4 flex gap-2">
                  <button
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white"
                    onClick={() => handleAction(r.id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white"
                    onClick={() => handleAction(r.id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
