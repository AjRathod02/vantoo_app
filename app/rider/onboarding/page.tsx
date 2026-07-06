"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RiderOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [me, setMe] = useState<{ rider: { status: string; fullName: string } | null; platformEnabled: boolean } | null>(null);
  const [docForm, setDocForm] = useState({ documentType: "driving_license", documentNumber: "", fileUrl: "" });

  const [form, setForm] = useState({
    fullName: "",
    phone: "+91",
    email: "",
    vehicleType: "motorcycle",
    vehicleNumber: "",
    city: "",
    pincode: "",
  });

  useEffect(() => {
    fetch("/api/rider/me")
      .then((r) => r.json())
      .then((data) => {
        setMe(data);
        if (data.rider?.status === "approved") router.replace("/rider");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/rider/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Application failed");
      const meRes = await fetch("/api/rider/me");
      setMe(await meRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDocUpload(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/rider/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setDocForm({ documentType: "driving_license", documentNumber: "", fileUrl: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-ink-muted">Loading...</p>;

  if (me && !me.platformEnabled) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-orange-200 bg-orange-50 p-6">
        <h1 className="text-xl font-bold text-ink">Rider onboarding unavailable</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Enable platform mode (<code>PLATFORM_ENABLED=true</code>) and start the rider service to apply.
        </p>
      </div>
    );
  }

  const hasRider = Boolean(me?.rider);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Become a Vantoo Rider</h1>
        <p className="text-sm text-ink-muted">Deliver orders and earn on your schedule.</p>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!hasRider ? (
        <form onSubmit={handleApply} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
          <Input label="Full Name" id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <Input label="Phone" id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label="Email" id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Vehicle Type</label>
            <select
              className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm"
              value={form.vehicleType}
              onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
            >
              <option value="bicycle">Bicycle</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="scooter">Scooter</option>
              <option value="car">Car</option>
            </select>
          </div>
          <Input label="Vehicle Number" id="vehicleNumber" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
          <Input label="City" id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          <Input label="Pincode" id="pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required />
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
          <p className="font-semibold text-ink">Application status: {me!.rider!.status.replace("_", " ")}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {me!.rider!.status === "approved"
              ? "You are approved! Head to your dashboard."
              : "Upload KYC documents below. Our team will review your application."}
          </p>
        </div>
      )}

      {hasRider && me!.rider!.status !== "approved" && (
        <form onSubmit={handleDocUpload} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
          <h2 className="font-bold text-ink">Upload KYC Documents</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Document Type</label>
            <select
              className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm"
              value={docForm.documentType}
              onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
            >
              <option value="driving_license">Driving License</option>
              <option value="aadhaar">Aadhaar</option>
              <option value="pan">PAN</option>
              <option value="vehicle_rc">Vehicle RC</option>
              <option value="insurance">Insurance</option>
            </select>
          </div>
          <Input label="Document Number" id="docNumber" value={docForm.documentNumber} onChange={(e) => setDocForm({ ...docForm, documentNumber: e.target.value })} />
          <Input label="Document URL" id="fileUrl" value={docForm.fileUrl} onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })} hint="Paste a URL to your document image/PDF" required />
          <Button type="submit" variant="secondary" disabled={submitting}>Upload Document</Button>
        </form>
      )}
    </div>
  );
}
