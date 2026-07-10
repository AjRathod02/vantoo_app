"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import type { VendorProfile } from "@/lib/platform/vendors";

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [actionId, setActionId] = useState<string | null>(null);

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
    setActionId(vendorId);
    const reason = action === "reject" ? prompt("Rejection reason:") : undefined;
    if (action === "reject" && !reason) {
      setActionId(null);
      return;
    }

    await fetch("/api/admin/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, vendorId, reason }),
    });
    setActionId(null);
    load();
  }

  return (
    <AdminPageShell
      title="Vendor Applications"
      subtitle="Review and approve vendor onboarding requests"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {["pending", "under_review", "approved", "rejected"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
                filter === s ? "bg-brand-primary text-white" : "bg-gray-100 text-ink-muted"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-ink-muted">Loading...</p>
        ) : vendors.length === 0 ? (
          <p className="text-ink-muted">No vendors in this category.</p>
        ) : (
          <div className="space-y-4">
            {vendors.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-ink">{v.businessName}</h2>
                    <p className="text-sm text-ink-muted">
                      {v.contactEmail} · {v.contactPhone}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Applied {new Date(v.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <Badge
                    tone={
                      v.status === "approved"
                        ? "green"
                        : v.status === "rejected"
                          ? "red"
                          : "orange"
                    }
                  >
                    {v.status.replace("_", " ")}
                  </Badge>
                </div>
                {(v.status === "pending" || v.status === "under_review") && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      disabled={actionId === v.id}
                      onClick={() => handleAction(v.id, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionId === v.id}
                      onClick={() => handleAction(v.id, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
