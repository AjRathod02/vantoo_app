"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/utils";
import { toast } from "@/lib/stores/toast";

export default function AdminSponsorshipsPage() {
  const [packages, setPackages] = useState<
    Array<{
      id: string;
      name: string;
      price: number;
      duration_days: number;
      is_active: boolean;
    }>
  >([]);
  const [sponsorships, setSponsorships] = useState<
    Array<{
      id: string;
      restaurant_name: string;
      status: string;
      starts_at: string | null;
      ends_at: string | null;
      amount_paid: number;
    }>
  >([]);
  const [offers, setOffers] = useState<
    Array<{
      id: string;
      restaurant_name: string;
      badge_text: string;
      ends_at: string;
      is_active: boolean;
    }>
  >([]);

  const load = () => {
    fetch("/api/promotions?view=admin")
      .then((r) => r.json())
      .then((d) => {
        setPackages(d.packages ?? []);
        setSponsorships(d.sponsorships ?? []);
        setOffers(d.offers ?? []);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    const res = await fetch("/api/promotions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sponsorshipId: id, status: "approved" }),
    });
    if (res.ok) {
      toast.success("Sponsorship activated");
      load();
    } else toast.error("Failed");
  };

  const updatePrice = async (id: string, price: number) => {
    const res = await fetch("/api/promotions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ package: { id, price } }),
    });
    if (res.ok) {
      toast.success("Pricing updated");
      load();
    }
  };

  return (
    <>
      <AdminHeader
        title="Sponsorships & Offers"
        subtitle="Approve restaurant sponsorships and manage flash deals"
      />
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
          <h2 className="mb-4 font-semibold text-ink">Sponsorship Packages</h2>
          <div className="space-y-3">
            {packages.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-ink-soft">{p.duration_days} days</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    defaultValue={Number(p.price)}
                    className="h-9 w-28 rounded-lg border border-gray-200 px-2 text-sm"
                    onBlur={(e) => updatePrice(p.id, Number(e.target.value))}
                  />
                  <Badge tone={p.is_active ? "green" : "gray"}>
                    {p.is_active ? "Active" : "Off"}
                  </Badge>
                </div>
              </div>
            ))}
            {packages.length === 0 && (
              <p className="text-sm text-ink-muted">
                No packages in DB yet — seed data used on homepage.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
          <h2 className="mb-4 font-semibold text-ink">Sponsorship Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b text-ink-muted">
                  <th className="pb-2 font-medium">Restaurant</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Schedule</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sponsorships.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50">
                    <td className="py-3">{s.restaurant_name}</td>
                    <td className="py-3">{formatINR(Number(s.amount_paid))}</td>
                    <td className="py-3 text-xs text-ink-soft">
                      {s.starts_at
                        ? new Date(s.starts_at).toLocaleDateString("en-IN")
                        : "—"}{" "}
                      →{" "}
                      {s.ends_at
                        ? new Date(s.ends_at).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td className="py-3">
                      <Badge>{s.status}</Badge>
                    </td>
                    <td className="py-3">
                      {s.status === "pending" && (
                        <Button size="sm" onClick={() => approve(s.id)}>
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
          <h2 className="mb-4 font-semibold text-ink">Flash Offers</h2>
          <div className="space-y-2">
            {offers.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">
                    {o.restaurant_name} · {o.badge_text}
                  </p>
                  <p className="text-xs text-ink-soft">
                    Ends {new Date(o.ends_at).toLocaleString("en-IN")}
                  </p>
                </div>
                <Badge tone={o.is_active ? "orange" : "gray"}>
                  {o.is_active ? "Live" : "Off"}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
