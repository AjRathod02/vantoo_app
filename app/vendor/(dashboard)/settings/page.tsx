import { getVendorContext, isApprovedVendor } from "@/lib/server/vendor";
export default async function VendorSettingsPage() {
  const { vendorData } = await getVendorContext();
  const vendor = vendorData!.vendor!;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
        <p className="text-sm text-ink-muted">Business and payout information.</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card space-y-4">
        <div>
          <p className="text-sm text-ink-muted">Business Name</p>
          <p className="font-medium text-ink">{vendor.businessName}</p>
        </div>
        <div>
          <p className="text-sm text-ink-muted">Contact</p>
          <p className="font-medium text-ink">{vendor.contactEmail} · {vendor.contactPhone}</p>
        </div>
        <div>
          <p className="text-sm text-ink-muted">GST / PAN</p>
          <p className="font-medium text-ink">{vendor.gstNumber ?? "—"} / {vendor.panNumber ?? "—"}</p>
        </div>
        <div>
          <p className="text-sm text-ink-muted">Commission Rate</p>
          <p className="font-medium text-ink">{vendor.commissionRate}%</p>
        </div>
        <div>
          <p className="text-sm text-ink-muted">Account Status</p>
          <p className="font-medium capitalize text-ink">{vendor.status.replace("_", " ")}</p>
        </div>
      </div>

      {!isApprovedVendor(vendorData) && (
        <p className="text-sm text-orange-600">
          Complete onboarding and get approved to access full settings and payouts.
        </p>
      )}
    </div>
  );
}
