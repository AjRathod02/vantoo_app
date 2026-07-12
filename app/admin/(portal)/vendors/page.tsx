"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable, type AdminColumn } from "@/components/admin/AdminDataTable";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { AdminActionsMenu } from "@/components/admin/AdminActionsMenu";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { toast } from "@/lib/stores/toast";
import type { VendorProfile } from "@/lib/platform/vendors";

type VendorAction = "approve" | "reject" | "suspend" | "block";

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

function vendorAddress(v: VendorProfile): string {
  const b = v.bankAccount ?? {};
  const parts = [
    bankStr(b, "address", "addressLine1", "line1"),
    bankStr(b, "city"),
    bankStr(b, "state"),
    bankStr(b, "pincode", "pin"),
  ].filter((p) => p !== "—");
  return parts.length ? parts.join(", ") : "—";
}

function vendorBusinessType(v: VendorProfile): string {
  const b = v.bankAccount ?? {};
  return bankStr(b, "businessType", "accountType", "type", "category");
}

function sortVendors(list: VendorProfile[], sort: string): VendorProfile[] {
  const copy = [...list];
  if (sort === "name") {
    copy.sort((a, b) => a.businessName.localeCompare(b.businessName));
  } else if (sort === "oldest") {
    copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else {
    copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return copy;
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
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
    fetch(`/api/admin/vendors?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          toast.error(d.error ?? "Failed to load vendors");
          setVendors([]);
          setTotal(0);
          setWarning("");
          return;
        }
        setVendors(d.vendors ?? []);
        setTotal(d.total ?? 0);
        setWarning(d.warning ?? "");
      })
      .catch(() => {
        setVendors([]);
        setTotal(0);
        setWarning("");
        toast.error("Failed to load vendors");
      })
      .finally(() => setLoading(false));
  }, [search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => sortVendors(vendors, sort), [vendors, sort]);

  const mutate = async (
    vendorId: string,
    action: VendorAction,
    reason?: string,
    successMsg?: string
  ) => {
    setActionId(vendorId);
    try {
      const res = await fetch("/api/admin/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, vendorId, reason }),
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

  const rejectVendor = (vendorId: string) => {
    const reason = prompt("Rejection reason (required):");
    if (!reason?.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    mutate(vendorId, "reject", reason.trim(), "Vendor rejected");
  };

  const emptyMessage =
    search || status
      ? "No vendors match your filters."
      : warning ||
        "No vendors found. Platform services may be offline or no vendors are registered yet.";

  const columns: AdminColumn<VendorProfile>[] = useMemo(
    () => [
      {
        key: "id",
        label: "Vendor ID",
        sortable: true,
        sortValue: (r) => r.id,
        render: (r) => (
          <span className="font-mono text-xs text-ink-muted">{r.id.slice(0, 8)}…</span>
        ),
      },
      {
        key: "logo",
        label: "Shop Logo",
        render: (r) => (
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-xs font-semibold text-ink-muted">
            {r.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (r.businessName || "?").charAt(0).toUpperCase()
            )}
          </div>
        ),
      },
      {
        key: "businessName",
        label: "Shop Name",
        sortable: true,
        sortValue: (r) => r.businessName,
        render: (r) => <span className="font-medium text-ink">{r.businessName || "—"}</span>,
      },
      {
        key: "legalName",
        label: "Owner Name",
        sortable: true,
        sortValue: (r) => r.legalName,
        render: (r) => <span className="text-ink-muted">{r.legalName || "—"}</span>,
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
        sortValue: (r) => r.contactEmail,
        render: (r) => <span className="text-ink-muted">{r.contactEmail || "—"}</span>,
      },
      {
        key: "phone",
        label: "Mobile",
        render: (r) => <span className="text-ink-muted">{r.contactPhone || "—"}</span>,
      },
      {
        key: "businessType",
        label: "Business Type",
        render: (r) => <span className="capitalize text-ink-muted">{vendorBusinessType(r)}</span>,
      },
      {
        key: "gst",
        label: "GST",
        render: (r) => (
          <span className="font-mono text-xs text-ink-muted">{r.gstNumber || "—"}</span>
        ),
      },
      {
        key: "pan",
        label: "PAN / Registration",
        render: (r) => (
          <span className="font-mono text-xs text-ink-muted">{r.panNumber || "—"}</span>
        ),
      },
      {
        key: "address",
        label: "Address",
        render: (r) => (
          <span className="max-w-[180px] truncate text-ink-muted" title={vendorAddress(r)}>
            {vendorAddress(r)}
          </span>
        ),
      },
      {
        key: "registered",
        label: "Registration Date",
        sortable: true,
        sortValue: (r) => new Date(r.createdAt).getTime(),
        render: (r) => <span className="text-ink-muted">{fmtDate(r.createdAt)}</span>,
      },
      {
        key: "status",
        label: "Verification Status",
        sortable: true,
        sortValue: (r) => r.status,
        render: (r) => <AdminStatusBadge status={r.status} />,
      },
      {
        key: "online",
        label: "Online/Offline",
        render: (r) => (
          <AdminStatusBadge status={r.status === "approved" ? "online" : "offline"} />
        ),
      },
      {
        key: "products",
        label: "Active Products",
        render: () => <span className="text-ink-muted">—</span>,
      },
      {
        key: "orders",
        label: "Total Orders",
        render: () => <span className="text-ink-muted">—</span>,
      },
      {
        key: "revenue",
        label: "Revenue",
        render: () => <span className="text-ink-muted">—</span>,
      },
      {
        key: "rating",
        label: "Rating",
        render: () => <span className="text-ink-muted">—</span>,
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
                onClick: () => mutate(r.id, "approve", undefined, "Vendor approved"),
              },
              {
                label: "Reject",
                tone: "danger",
                disabled: actionId === r.id || r.status === "rejected",
                onClick: () => rejectVendor(r.id),
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
                onClick: () => mutate(r.id, "suspend", undefined, "Vendor suspended"),
              },
              {
                label: "Block",
                tone: "danger",
                disabled: actionId === r.id,
                onClick: () => mutate(r.id, "block", undefined, "Vendor blocked"),
              },
              {
                label: "Delete",
                tone: "danger",
                disabled: actionId === r.id,
                onClick: () => {
                  toast.info("Soft suspend is used instead of hard delete");
                  mutate(r.id, "suspend", undefined, "Vendor suspended (soft delete)");
                },
              },
              { divider: true, label: "", onClick: () => {} },
              {
                label: "View Products",
                onClick: () => {
                  window.location.href = `/admin/products?vendor=${r.id}`;
                },
              },
              {
                label: "View Orders",
                onClick: () => {
                  window.location.href = `/admin/orders?vendor=${r.id}`;
                },
              },
              {
                label: "View Reviews",
                onClick: () => {
                  window.location.href = `/admin/reviews?vendor=${r.id}`;
                },
              },
              {
                label: "View Complaints",
                onClick: () => {
                  window.location.href = `/admin/complaints?vendor=${r.id}`;
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
      title="Vendor Management"
      subtitle={`${total} vendors · onboarding, verification, and shop oversight`}
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
          placeholder="Search shop name, email, phone, GST, ID…"
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
