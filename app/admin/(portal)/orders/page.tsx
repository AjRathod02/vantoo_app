"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Order, OrderStatus } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { Button } from "@/components/ui/Button";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { toast } from "@/lib/stores/toast";

const statuses: OrderStatus[] = [
  "confirmed",
  "packed",
  "in_transit",
  "delivered",
  "cancelled",
];

const ACTIVE_STATUSES = new Set([
  "confirmed",
  "preparing",
  "packed",
  "assigned",
  "picked",
  "in_transit",
]);

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = () =>
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.address?.fullName?.toLowerCase().includes(q) ||
        o.address?.city?.toLowerCase().includes(q) ||
        o.tracking?.riderName?.toLowerCase().includes(q) ||
        o.paymentMethod.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  const update = async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      toast.error("Update failed");
      return;
    }
    toast.success("Order updated");
    load();
  };

  return (
    <AdminPageShell title="Orders" subtitle="Manage orders, assign riders, and process refunds">
      <div className="space-y-6">
        <AdminFilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search order ID, customer, city, rider…"
          filters={[
            {
              key: "status",
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "", label: "All" },
                ...statuses.map((s) => ({
                  value: s,
                  label: s.replace(/_/g, " "),
                })),
              ],
            },
          ]}
        />

        {loading ? (
          <AdminTableSkeleton rows={5} cols={4} />
        ) : filtered.length === 0 ? (
          <p className="text-ink-muted">No orders found.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-ink">#{order.id}</p>
                    <p className="text-xs text-ink-soft">
                      {new Date(order.placedAt).toLocaleString("en-IN")}
                      {order.address?.city ? ` · ${order.address.city}` : ""}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <p className="mb-3 text-sm text-ink-muted">
                  {order.items.length} items · {formatINR(order.total)} ·{" "}
                  {order.paymentMethod.toUpperCase()} ·{" "}
                  {order.paymentStatus ?? "pending"}
                </p>

                <div className="flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={order.status === status ? "primary" : "outline"}
                      onClick={() => update(order.id, { status })}
                    >
                      {status.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>

                {order.refundStatus === "requested" && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        update(order.id, {
                          refundStatus: "processing",
                        })
                      }
                    >
                      Process refund
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        update(order.id, {
                          refundStatus: "completed",
                          refundAmount: order.total,
                        })
                      }
                    >
                      Complete refund
                    </Button>
                  </div>
                )}

                {ACTIVE_STATUSES.has(order.status) && (
                  <Link
                    href={`/admin/orders/${order.id}/tracking`}
                    className="mt-3 inline-block text-sm font-medium text-brand-primary hover:underline"
                  >
                    View live tracking →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}
