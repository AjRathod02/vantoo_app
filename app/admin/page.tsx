import Link from "next/link";
import { Package, ShoppingBag, Users } from "lucide-react";
import { listAllOrders } from "@/lib/server/orders";
import { listProducts } from "@/lib/server/products";

export default async function AdminDashboardPage() {
  const [orders, products] = await Promise.all([listAllOrders(), listProducts()]);

  const ongoing = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  ).length;
  const revenue = orders
    .filter((o) => o.paymentStatus === "paid" || o.paymentMethod === "cod")
    .reduce((sum, o) => sum + o.total, 0);

  const cards = [
    { label: "Total Products", value: products.length, icon: Package },
    { label: "Total Orders", value: orders.length, icon: ShoppingBag },
    { label: "Ongoing Orders", value: ongoing, icon: Users },
    { label: "Revenue (₹)", value: revenue.toLocaleString("en-IN"), icon: ShoppingBag },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Admin Dashboard</h1>
        <p className="text-sm text-ink-muted">
          Manage products, orders, payments, and live delivery tracking.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-ink-muted">{label}</span>
              <Icon className="h-5 w-5 text-brand-primary" />
            </div>
            <p className="text-2xl font-bold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/products"
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-shadow hover:shadow-cardHover"
        >
          <h2 className="font-bold text-ink">Manage Products</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Add, edit stock, and update pricing across all services.
          </p>
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card transition-shadow hover:shadow-cardHover"
        >
          <h2 className="font-bold text-ink">Manage Orders</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Update status, assign riders, and process refunds.
          </p>
        </Link>
      </div>
    </div>
  );
}
