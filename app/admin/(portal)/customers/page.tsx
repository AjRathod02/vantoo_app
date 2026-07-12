"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminDataTable, type AdminColumn } from "@/components/admin/AdminDataTable";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { AdminActionsMenu } from "@/components/admin/AdminActionsMenu";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { formatINR } from "@/lib/utils";
import { toast } from "@/lib/stores/toast";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  account_status: string;
  created_at: string;
  last_login_at: string | null;
  referral_code: string | null;
  total_orders: number;
  total_spending: number;
  wallet_balance: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
  verification_status: string;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", gender: "" });

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (sort) params.set("sort", sort);
    params.set("limit", "100");
    fetch(`/api/admin/customers?${params}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          toast.error(d.error ?? "Failed to load customers");
          setCustomers([]);
          setTotal(0);
          return;
        }
        setCustomers(d.customers ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoading(false));
  }, [search, status, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const mutate = async (id: string, body: Record<string, unknown>, success: string) => {
    const res = await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Update failed");
      return;
    }
    toast.success(success);
    load();
    if (selected?.id === id) openProfile(id);
  };

  const openProfile = async (id: string) => {
    const res = await fetch(`/api/admin/customers/${id}`);
    const d = await res.json();
    if (!res.ok) {
      toast.error(d.error ?? "Failed to load profile");
      return;
    }
    setSelected(customers.find((c) => c.id === id) ?? null);
    setDetail(d);
  };

  const columns: AdminColumn<Customer>[] = useMemo(
    () => [
      {
        key: "id",
        label: "Customer ID",
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
            {r.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              (r.name || "?").charAt(0).toUpperCase()
            )}
          </div>
        ),
      },
      {
        key: "name",
        label: "Full Name",
        sortable: true,
        sortValue: (r) => r.name,
        render: (r) => <span className="font-medium text-ink">{r.name || "—"}</span>,
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
        sortValue: (r) => r.email ?? "",
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
        render: (r) => (
          <span className="text-ink-muted">
            {r.date_of_birth ? new Date(r.date_of_birth).toLocaleDateString("en-IN") : "—"}
          </span>
        ),
      },
      {
        key: "gender",
        label: "Gender",
        render: (r) => <span className="capitalize text-ink-muted">{r.gender || "—"}</span>,
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        sortValue: (r) => r.account_status,
        render: (r) => <AdminStatusBadge status={r.account_status} />,
      },
      {
        key: "registered",
        label: "Registered",
        sortable: true,
        sortValue: (r) => new Date(r.created_at).getTime(),
        render: (r) => (
          <span className="text-ink-muted">
            {new Date(r.created_at).toLocaleDateString("en-IN")}
          </span>
        ),
      },
      {
        key: "last_login",
        label: "Last Login",
        render: (r) => (
          <span className="text-ink-muted">
            {r.last_login_at ? new Date(r.last_login_at).toLocaleString("en-IN") : "—"}
          </span>
        ),
      },
      {
        key: "orders",
        label: "Orders",
        sortable: true,
        sortValue: (r) => r.total_orders,
        render: (r) => r.total_orders,
      },
      {
        key: "spend",
        label: "Spending",
        sortable: true,
        sortValue: (r) => r.total_spending,
        render: (r) => formatINR(r.total_spending),
      },
      {
        key: "wallet",
        label: "Wallet",
        sortable: true,
        sortValue: (r) => r.wallet_balance,
        render: (r) => formatINR(r.wallet_balance),
      },
      {
        key: "referral",
        label: "Referral",
        render: (r) => (
          <span className="font-mono text-xs text-ink-muted">{r.referral_code || "—"}</span>
        ),
      },
      {
        key: "city",
        label: "City",
        sortable: true,
        sortValue: (r) => r.city,
        render: (r) => r.city || "—",
      },
      {
        key: "state",
        label: "State",
        render: (r) => r.state || "—",
      },
      {
        key: "pin",
        label: "PIN",
        render: (r) => r.pincode || "—",
      },
      {
        key: "verify",
        label: "Verification",
        render: (r) => <AdminStatusBadge status={r.verification_status} />,
      },
      {
        key: "actions",
        label: "Actions",
        headerClassName: "text-right",
        className: "text-right",
        render: (r) => (
          <AdminActionsMenu
            items={[
              { label: "View Profile", onClick: () => openProfile(r.id) },
              {
                label: "Edit Customer",
                onClick: () => {
                  setSelected(r);
                  setEditForm({
                    name: r.name,
                    email: r.email ?? "",
                    phone: r.phone ?? "",
                    gender: r.gender ?? "",
                  });
                  setEditOpen(true);
                },
              },
              { divider: true, label: "", onClick: () => {} },
              {
                label: "Suspend Account",
                tone: "danger",
                onClick: () => mutate(r.id, { action: "suspend" }, "Account suspended"),
              },
              {
                label: "Block Account",
                tone: "danger",
                onClick: () => mutate(r.id, { action: "block" }, "Account blocked"),
              },
              {
                label: "Activate Account",
                tone: "success",
                onClick: () => mutate(r.id, { action: "activate" }, "Account activated"),
              },
              {
                label: "Delete Account",
                tone: "danger",
                onClick: async () => {
                  if (!confirm("Soft-delete this customer account?")) return;
                  const res = await fetch(`/api/admin/customers/${r.id}`, { method: "DELETE" });
                  if (res.ok) {
                    toast.success("Customer deleted");
                    load();
                  } else toast.error("Delete failed");
                },
              },
              { divider: true, label: "", onClick: () => {} },
              {
                label: "View Orders",
                onClick: () => {
                  openProfile(r.id);
                },
              },
              {
                label: "View Payments",
                onClick: () => openProfile(r.id),
              },
              {
                label: "View Complaints",
                onClick: () => {
                  window.location.href = `/admin/complaints?user=${r.id}`;
                },
              },
              {
                label: "View Reviews",
                onClick: () => {
                  window.location.href = `/admin/reviews?user=${r.id}`;
                },
              },
            ]}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customers]
  );

  return (
    <AdminPageShell
      title="Customer Management"
      subtitle={`${total} customers · searchable profiles, orders, wallet & status`}
    >
      <div className="space-y-4">
        <AdminFilterBar
          search={search}
          onSearchChange={setSearch}
          onSearchSubmit={load}
          placeholder="Search name, email, phone, ID, city, referral…"
          sort={{
            value: sort,
            onChange: setSort,
            options: [
              { value: "newest", label: "Newest" },
              { value: "oldest", label: "Oldest" },
              { value: "name", label: "Name" },
              { value: "orders", label: "Most orders" },
              { value: "spending", label: "Highest spend" },
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
                { value: "active", label: "Active" },
                { value: "suspended", label: "Suspended" },
                { value: "blocked", label: "Blocked" },
                { value: "deleted", label: "Deleted" },
              ],
            },
          ]}
        />

        {loading ? (
          <AdminTableSkeleton cols={8} />
        ) : (
          <AdminDataTable
            rows={customers}
            columns={columns}
            rowKey={(r) => r.id}
            pageSize={20}
            minWidth="1400px"
            emptyMessage="No customers found."
          />
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={() => setDetail(null)}>
          <div
            className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink">
                  {(detail.customer as { name?: string })?.name ?? "Customer"}
                </h2>
                <p className="text-sm text-ink-muted">
                  {(detail.customer as { email?: string })?.email}
                </p>
              </div>
              <button type="button" className="text-ink-muted" onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
            <section className="mb-6 space-y-2">
              <h3 className="text-sm font-semibold text-ink">Addresses</h3>
              {((detail.addresses as unknown[]) ?? []).length === 0 ? (
                <p className="text-sm text-ink-muted">No addresses</p>
              ) : (
                (detail.addresses as Array<Record<string, string>>).map((a) => (
                  <p key={a.id} className="rounded-xl bg-gray-50 p-3 text-sm text-ink-muted">
                    {a.line1}, {a.city} {a.pincode}
                  </p>
                ))
              )}
            </section>
            <section className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-ink">
                Orders ({((detail.orders as unknown[]) ?? []).length})
              </h3>
              <div className="space-y-2">
                {((detail.orders as Array<{ id: string; total: number; status: string }>) ?? [])
                  .slice(0, 8)
                  .map((o) => (
                    <Link
                      key={o.id}
                      href={`/admin/orders/${o.id}/tracking`}
                      className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <span>#{o.id}</span>
                      <span className="text-ink-muted">
                        {formatINR(o.total)} · {o.status}
                      </span>
                    </Link>
                  ))}
              </div>
            </section>
            <section className="mb-6">
              <h3 className="mb-2 text-sm font-semibold text-ink">
                Complaints ({((detail.complaints as unknown[]) ?? []).length})
              </h3>
              <p className="text-sm text-ink-muted">
                {((detail.complaints as unknown[]) ?? []).length === 0
                  ? "No complaints"
                  : `${(detail.complaints as unknown[]).length} ticket(s)`}
              </p>
            </section>
            <section>
              <h3 className="mb-2 text-sm font-semibold text-ink">
                Reviews ({((detail.reviews as unknown[]) ?? []).length})
              </h3>
              <p className="text-sm text-ink-muted">
                {((detail.reviews as unknown[]) ?? []).length === 0
                  ? "No reviews"
                  : `${(detail.reviews as unknown[]).length} review(s)`}
              </p>
            </section>
          </div>
        </div>
      )}

      {editOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-ink">Edit Customer</h2>
            <div className="space-y-3">
              {(["name", "email", "phone", "gender"] as const).map((field) => (
                <label key={field} className="block text-sm">
                  <span className="mb-1 block font-medium capitalize text-ink">{field}</span>
                  <input
                    className="h-11 w-full rounded-xl border border-gray-200 px-3"
                    value={editForm[field]}
                    onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border px-4 py-2 text-sm"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
                onClick={async () => {
                  await mutate(selected.id, editForm, "Customer updated");
                  setEditOpen(false);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
