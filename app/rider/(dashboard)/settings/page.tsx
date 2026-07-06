import { getRiderContext } from "@/lib/server/rider";

export default async function RiderSettingsPage() {
  const { riderData } = await getRiderContext();
  const rider = riderData!.rider!;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
        <p className="text-sm text-ink-muted">Profile and vehicle information.</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card space-y-4">
        <div>
          <p className="text-sm text-ink-muted">Full Name</p>
          <p className="font-medium text-ink">{rider.fullName}</p>
        </div>
        <div>
          <p className="text-sm text-ink-muted">Contact</p>
          <p className="font-medium text-ink">{rider.email} · {rider.phone}</p>
        </div>
        <div>
          <p className="text-sm text-ink-muted">Vehicle</p>
          <p className="font-medium capitalize text-ink">
            {rider.vehicleType.replace("_", " ")} {rider.vehicleNumber ? `· ${rider.vehicleNumber}` : ""}
          </p>
        </div>
        <div>
          <p className="text-sm text-ink-muted">Service Area</p>
          <p className="font-medium text-ink">{rider.city}, {rider.pincode}</p>
        </div>
        <div>
          <p className="text-sm text-ink-muted">Account Status</p>
          <p className="font-medium capitalize text-ink">{rider.status.replace("_", " ")}</p>
        </div>
      </div>
    </div>
  );
}
