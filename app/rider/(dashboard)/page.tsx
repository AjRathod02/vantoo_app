import Link from "next/link";
import { Bike, IndianRupee, MapPin, Package } from "lucide-react";
import { getRiderContext } from "@/lib/server/rider";
import { RiderOnlineToggle } from "@/components/rider/RiderOnlineToggle";

export default async function RiderDashboardPage() {
  const { riderData } = await getRiderContext();
  const { rider, stats, availability } = riderData!;

  const cards = [
    { label: "Total Deliveries", value: stats?.totalDeliveries ?? 0, icon: Package },
    { label: "Active Now", value: stats?.activeDeliveries ?? 0, icon: Bike },
    { label: "Today's Deliveries", value: stats?.todayDeliveries ?? 0, icon: MapPin },
    { label: "Today's Earnings", value: `₹${(stats?.todayEarnings ?? 0).toLocaleString("en-IN")}`, icon: IndianRupee },
    { label: "Total Earnings", value: `₹${(stats?.totalEarnings ?? 0).toLocaleString("en-IN")}`, icon: IndianRupee },
    { label: "Rating", value: (stats?.rating ?? 4.8).toFixed(1), icon: Bike },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{rider!.fullName}</h1>
          <p className="text-sm text-ink-muted capitalize">
            {rider!.vehicleType.replace("_", " ")} · {rider!.city}
          </p>
        </div>
        <RiderOnlineToggle initialStatus={availability?.status ?? "offline"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-ink-muted">{label}</span>
              <Icon className="h-5 w-5 text-brand-secondary" />
            </div>
            <p className="text-2xl font-bold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/rider/deliveries" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card hover:shadow-cardHover">
          <h2 className="font-bold text-ink">My Deliveries</h2>
          <p className="mt-1 text-sm text-ink-muted">View active and completed deliveries.</p>
        </Link>
        <Link href="/rider/earnings" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card hover:shadow-cardHover">
          <h2 className="font-bold text-ink">Earnings</h2>
          <p className="mt-1 text-sm text-ink-muted">Track delivery fees and payouts.</p>
        </Link>
      </div>

      {(stats?.activeDeliveries ?? 0) > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <p className="font-semibold text-orange-800">
            You have {stats!.activeDeliveries} active {stats!.activeDeliveries === 1 ? "delivery" : "deliveries"}
          </p>
          <Link href="/rider/deliveries" className="mt-3 inline-block text-sm font-medium text-brand-primary">
            View deliveries →
          </Link>
        </div>
      )}
    </div>
  );
}
