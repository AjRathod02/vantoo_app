"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable, type AdminColumn } from "@/components/admin/AdminDataTable";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { AdminActionsMenu } from "@/components/admin/AdminActionsMenu";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { toast } from "@/lib/stores/toast";
import type { RiderProfile } from "@/lib/platform/riders";

type RiderAction = "approve" | "reject" | "suspend" | "block";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN");
}

function bankStr(bank: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = bank[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "—";
}

function riderLocation(r: RiderProfile): string {
  const parts = [r.city, r.state].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function sortRiders(list: RiderProfile[], sort: string): RiderProfile[] {
  const copy = [...list];
  if (sort === "name") {
    copy.sort((a, b) => a.fullName.localeCompare(b.fullName));
  } else if (sort === "oldest") {
    copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else {
    copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return copy;
}

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [warning, setWarning] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    fetch(`/api/admin/riders?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          toast.error(d.error ?? "Failed to load riders");
          setRiders([]);
          setTotal(0);
          setWarning("");
          return;
        }
        setRiders(d.riders ?? []);
        setTotal(d.total ?? 0);
        setWarning(d.warning ?? "");
      })
      .catch(() => {
        setRiders([]);
        setTotal(0);
        setWarning("");
        toast.error("Failed to load riders");
      })
      .finally(() => setLoading(false));
  }, [search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => sortRiders(riders, sort), [riders, sort]);

  const mutate = async (
    riderId: string,
    action: RiderAction,
    reason?: string,
    successMsg?: string
  ) => {
    setActionId(riderId);
    try {
      const res = await fetch("/api/admin/riders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, riderId, reason }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((d.error as string) ?? "Action failed");
        return;
      }
      toast.success(
        successMsg ??
          `${action.charAt(0).toUpperCase() + action.slice(1)} completed successfully`
      );
      load();
    } finally {
      setActionId(null);
    }
  };

  const rejectRider = (riderId: string) => {
    const reason = prompt("Rejection reason (required):");
    if (!reason?.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    mutate(riderId, "reject", reason.trim(), "Rider rejected");
  };

  const emptyMessage =
    search || status
      ? "No riders match your filters."
      : warning ||
        "No riders found. Platform services may be offline or no riders are registered yet.";

  const columns: AdminColumn<RiderProfile>[] = useMemo(
    () => [
      {
        key: "id",
        label: "Rider ID",
        sortable: true,
        sortValue: (r) => r.id,
        render: (r) => (
          <span className="font-mono text-xs text-ink-muted">{r.id.slice(0, 8)}…</span>
        ),
      },
      {
        key: "photo",
        label: "Photo",
        render: (r) => (
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-semibold text-ink-muted">
            {(r.fullName || "?").charAt(0).toUpperCase()}
          </div>
        ),
      },
      {
        key: "fullName",
        label: "Full Name",
        sortable: true,
        sortValue: (r) => r.fullName,
        render: (r) => <span className="font-medium text-ink">{r.fullName || "—"}</span>,
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
        sortValue: (r) => r.email,
        render: (r) => <span className="text-ink-muted">{r.email || "—"}</span>,
      },
      {
        key: "phone",
        label: "Mobile",
        render: (r) => <span className="text-ink-muted">{r.phone || "—"}</span>,
      },
      {
        key: "dob",
        label: "DOB",
        render: () => <span className="text-ink-muted">—</span>,
      },
      {
        key: "vehicleType",
        label: "Vehicle Type",
        sortable: true,
        sortValue: (r) => r.vehicleType,
        render: (r) => (
          <span className="capitalize text-ink-muted">
            {r.vehicleType?.replace(/_/g, " ") || "—"}
          </span>
        ),
      },
      {
        key: "vehicleNumber",
        label: "Vehicle Number",
        render: (r) => (
          <span className="font-mono text-xs uppercase text-ink-muted">
            {r.vehicleNumber || "—"}
          </span>
        ),
      },
      {
        key: "license",
        label: "License",
        render: (r) => (
          <span className="font-mono text-xs text-ink-muted">
            {bankStr(r.bankAccount ?? {}, "licenseNumber", "drivingLicense", "license")}
          </span>
        ),
      },
      {
        key: "aadhaar",
        label: "Aadhaar",
        render: (r) => (
          <span className="font-mono text-xs text-ink-muted">
            {bankStr(r.bankAccount ?? {}, "aadhaar", "aadhaarNumber")}
          </span>
        ),
      },
      {
        key: "pan",
        label: "PAN",
        render: (r) => (
          <span className="font-mono text-xs text-ink-muted">
            {bankStr(r.bankAccount ?? {}, "pan", "panNumber")}
          </span>
        ),
      },
      {
        key: "insurance",
        label: "Insurance",
        render: (r) => (
          <span className="text-ink-muted">
            {bankStr(r.bankAccount ?? {}, "insuranceNumber", "insurance")}
          </span>
        ),
      },
      {
        key: "status",
        label: "Current Status",
        sortable: true,
        sortValue: (r) => r.status,
        render: (r) => <AdminStatusBadge status={r.status} />,
      },
      {
        key: "location",
        label: "Current Location",
        sortable: true,
        sortValue: (r) => riderLocation(r),
        render: (r) => <span className="text-ink-muted">{riderLocation(r)}</span>,
      },
      {
        key: "deliveries",
        label: "Total Deliveries",
        render: () => <span className="text-ink-muted">—</span>,
      },
      {
        key: "earnings",
        label: "Earnings",
        render: () => <span className="text-ink-muted">—</span>,
      },
      {
        key: "rating",
        label: "Rating",
        render: () => <span className="text-ink-muted">—</span>,
      },
      {
        key: "registered",
        label: "Registration Date",
        sortable: true,
        sortValue: (r) => new Date(r.createdAt).getTime(),
        render: (r) => <span className="text-ink-muted">{fmtDate(r.createdAt)}</span>,
      },
      {
        key: "actions",
        label: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        render: (r) => (
          <AdminActionsMenu
            items={[
              {
                label: "Approve",
                tone: "success",
                disabled: actionId === r.id || r.status === "approved",
                onClick: () => mutate(r.id, "approve", undefined, "Rider approved"),
              },
              {
                label: "Reject",
                tone: "danger",
                disabled: actionId === r.id || r.status === "rejected",
                onClick: () => rejectRider(r.id),
              },
              {
                label: "Edit",
                onClick: () =>
                  toast.info("Edit form coming soon — use the platform console for now"),
              },
              { divider: true, label: "", onClick: () => {} },
              {
                label: "Suspend",
                tone: "danger",
                disabled: actionId === r.id || r.status === "suspended",
                onClick: () => mutate(r.id, "suspend", undefined, "Rider suspended"),
              },
              {
                label: "Block",
                tone: "danger",
                disabled: actionId === r.id,
                onClick: () => mutate(r.id, "block", undefined, "Rider blocked"),
              },
              {
                label: "Delete",
                tone: "danger",
                disabled: actionId === r.id,
                onClick: () => {
                  toast.info("Soft suspend is used instead of hard delete");
                  mutate(r.id, "suspend", undefined, "Rider suspended (soft delete)");
                },
              },
              { divider: true, label: "", onClick: () => {} },
              {
                label: "View Live Location",
                onClick: () => {
                  window.location.href = `/admin/tracking?rider=${r.id}`;
                },
              },
              {
                label: "View Delivery History",
                onClick: () => {
                  window.location.href = `/admin/orders?rider=${r.id}`;
                },
              },
              {
                label: "View Reviews",
                onClick: () => {
                  window.location.href = `/admin/reviews?rider=${r.id}`;
                },
              },
              {
                label: "View Complaints",
                onClick: () => {
                  window.location.href = `/admin/complaints?rider=${r.id}`;
                },
              },
            ]}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actionId]
  );

  return (
    <AdminPageShell
      title="Rider Management"
      subtitle={`${total} riders · onboarding, verification, and delivery fleet oversight`}
    >
      <div className="space-y-4">
        {warning && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {warning}
          </div>
        )}
        <AdminFilterBar
          search={search}
          onSearchChange={setSearch}
          onSearchSubmit={load}
          placeholder="Search name, email, phone, city, vehicle number, ID…"
          sort={{
            value: sort,
            onChange: setSort,
            options: [
              { value: "newest", label: "Newest" },
              { value: "oldest", label: "Oldest" },
              { value: "name", label: "Name" },
            ],
          }}
          filters={[
            {
              key: "status",
              label: "Status",
              value: status,
              onChange: setStatus,
              options: [
                { value: "", label: "All" },
                { value: "pending", label: "Pending" },
                { value: "under_review", label: "Under review" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
                { value: "suspended", label: "Suspended" },
              ],
            },
          ]}
        />

        {loading ? (
          <AdminTableSkeleton cols={8} />
        ) : (
          <AdminDataTable
            rows={sorted}
            columns={columns}
            rowKey={(r) => r.id}
            pageSize={20}
            minWidth="2400px"
            emptyMessage={emptyMessage}
          />
        )}
      </div>
    </AdminPageShell>
  );
}
