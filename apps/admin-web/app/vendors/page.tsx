"use client";

import { useCallback, useEffect, useState } from "react";

type Vendor = {
  id: string;
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
  createdAt: string;
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/vendors?status=${filter}`)
      .then((r) => r.json())
      .then((d) => setVendors(d.vendors ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAction(vendorId: string, action: "approve" | "reject") {
    const reason = action === "reject" ? prompt("Rejection reason:") : undefined;
    if (action === "reject" && !reason) return;
    await fetch("/api/admin/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, vendorId, reason }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vendor Applications</h1>
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
      ) : vendors.length === 0 ? (
        <p className="text-gray-500">No vendors found.</p>
      ) : (
        <div className="space-y-4">
          {vendors.map((v) => (
            <div key={v.id} className="rounded-2xl border bg-white p-5">
              <div className="flex justify-between gap-4">
                <div>
                  <h2 className="font-bold">{v.businessName}</h2>
                  <p className="text-sm text-gray-500">
                    {v.contactEmail} · {v.contactPhone}
                  </p>
                </div>
                <span className="text-sm capitalize">{v.status.replace("_", " ")}</span>
              </div>
              {(v.status === "pending" || v.status === "under_review") && (
                <div className="mt-4 flex gap-2">
                  <button
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white"
                    onClick={() => handleAction(v.id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white"
                    onClick={() => handleAction(v.id, "reject")}
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
