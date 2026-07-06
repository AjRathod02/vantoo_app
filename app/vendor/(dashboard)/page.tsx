import Link from "next/link";
import { Package, ShoppingBag, Store, TrendingUp } from "lucide-react";
import { getVendorContext } from "@/lib/server/vendor";
import { Button } from "@/components/ui/Button";

export default async function VendorDashboardPage() {
  const { vendorData } = await getVendorContext();
  const { vendor, stats } = vendorData!;
  const cards = [
    { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: ShoppingBag },
    { label: "Pending Orders", value: stats?.pendingOrders ?? 0, icon: TrendingUp },
    { label: "Revenue (₹)", value: (stats?.revenue ?? 0).toLocaleString("en-IN"), icon: TrendingUp },
    { label: "Active Products", value: stats?.activeProducts ?? 0, icon: Package },
    { label: "Total Products", value: stats?.totalProducts ?? 0, icon: Package },
    { label: "Stores", value: stats?.storeCount ?? 0, icon: Store },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">{vendor!.businessName}</h1>
        <p className="text-sm text-ink-muted">
          Manage your store, products, and incoming orders.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-ink-muted">{label}</span>
              <Icon className="h-5 w-5 text-brand-primary" />
            </div>
            <p className="text-2xl font-bold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/vendor/orders" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card hover:shadow-cardHover">
          <h2 className="font-bold text-ink">Manage Orders</h2>
          <p className="mt-1 text-sm text-ink-muted">Accept, prepare, and pack incoming orders.</p>
        </Link>
        <Link href="/vendor/products" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card hover:shadow-cardHover">
          <h2 className="font-bold text-ink">Manage Products</h2>
          <p className="mt-1 text-sm text-ink-muted">Add products, update pricing and stock.</p>
        </Link>
        <Link href="/vendor/stores" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card hover:shadow-cardHover">
          <h2 className="font-bold text-ink">Store Settings</h2>
          <p className="mt-1 text-sm text-ink-muted">Update store details, hours, and delivery radius.</p>
        </Link>
      </div>

      {(stats?.pendingOrders ?? 0) > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <p className="font-semibold text-orange-800">
            You have {stats!.pendingOrders} orders awaiting action
          </p>
          <Link href="/vendor/orders" className="mt-3 inline-block">
            <Button size="sm">View Orders</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
