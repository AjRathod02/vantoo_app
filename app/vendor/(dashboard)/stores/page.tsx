"use client";

import { useEffect, useState } from "react";
import type { VendorStore } from "@/lib/platform/vendors";

export default function VendorStoresPage() {
  const [stores, setStores] = useState<VendorStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/me")
      .then((r) => r.json())
      .then(async (me) => {
        if (!me.vendor) return;
        const res = await fetch("/api/vendor/stores").catch(() => null);
        if (res?.ok) {
          const data = await res.json();
          setStores(data.stores ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-ink-muted">Loading stores...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Stores</h1>
        <p className="text-sm text-ink-muted">Your store locations and delivery settings.</p>
      </div>

      {stores.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card">
          <p className="text-ink-muted">Store details are created during onboarding. Contact support to add additional locations.</p>
        </div>
      ) : (
        stores.map((store) => (
          <div key={store.id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink">{store.name}</h2>
                <p className="text-sm capitalize text-ink-muted">{store.storeType.replace("_", " ")}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${store.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {store.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              {store.addressLine1}, {store.city} — {store.pincode}
            </p>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div><span className="text-ink-muted">Delivery radius:</span> {store.deliveryRadiusKm} km</div>
              <div><span className="text-ink-muted">Min order:</span> ₹{store.minOrderAmount}</div>
              <div><span className="text-ink-muted">Avg delivery:</span> {store.avgDeliveryMins} min</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
