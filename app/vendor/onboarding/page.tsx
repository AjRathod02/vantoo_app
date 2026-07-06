"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type VendorMe = {
  vendor: { status: string; businessName: string } | null;
  platformEnabled: boolean;
};

export default function VendorOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [me, setMe] = useState<VendorMe | null>(null);
  const [docForm, setDocForm] = useState({ documentType: "pan", documentNumber: "", fileUrl: "" });

  const [form, setForm] = useState({
    businessName: "",
    contactEmail: "",
    contactPhone: "+91",
    storeType: "restaurant",
    storeName: "",
    addressLine1: "",
    city: "",
    pincode: "",
    gstNumber: "",
    panNumber: "",
  });

  useEffect(() => {
    fetch("/api/vendor/me")
      .then((r) => r.json())
      .then((data) => {
        setMe(data);
        if (data.vendor?.status === "approved") router.replace("/vendor");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/vendor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Application failed");
      const meRes = await fetch("/api/vendor/me");
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
      const res = await fetch("/api/vendor/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setDocForm({ documentType: "pan", documentNumber: "", fileUrl: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-ink-muted">Loading...</p>;

  if (me && !me.platformEnabled) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-gray-100 bg-white p-8 shadow-card">
        <h1 className="text-xl font-bold text-ink">Platform Mode Required</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Set <code className="rounded bg-gray-100 px-1">PLATFORM_ENABLED=true</code> and start platform services to use the vendor portal.
        </p>
      </div>
    );
  }

  if (me?.vendor) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card">
          <h1 className="text-xl font-bold text-ink">Application Status</h1>
          <p className="mt-2 text-ink-muted">
            <strong>{me.vendor.businessName}</strong> — status:{" "}
            <span className="capitalize text-brand-primary">{me.vendor.status.replace("_", " ")}</span>
          </p>
          {me.vendor.status === "approved" ? (
            <Button className="mt-4" onClick={() => router.push("/vendor")}>
              Go to Dashboard
            </Button>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">
              Upload KYC documents below. Our team will review your application within 24–48 hours.
            </p>
          )}
        </div>

        {me.vendor.status !== "approved" && (
          <form onSubmit={handleDocUpload} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card space-y-4">
            <h2 className="font-bold text-ink">Upload KYC Document</h2>
            <div>
              <label className="text-sm font-medium text-ink">Document Type</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={docForm.documentType}
                onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
              >
                <option value="pan">PAN Card</option>
                <option value="gst">GST Certificate</option>
                <option value="fssai">FSSAI License</option>
                <option value="bank_proof">Bank Proof</option>
                <option value="identity">Identity Proof</option>
              </select>
            </div>
            <Input
              label="Document Number"
              value={docForm.documentNumber}
              onChange={(e) => setDocForm({ ...docForm, documentNumber: e.target.value })}
            />
            <Input
              label="Document URL"
              placeholder="https://..."
              value={docForm.fileUrl}
              onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Uploading..." : "Upload Document"}
            </Button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Become a Vantoo Vendor</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Join thousands of sellers on Vantoo. Complete this form to start your application.
        </p>
      </div>

      <form onSubmit={handleApply} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-8 shadow-card">
        <Input label="Business Name" required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
        <Input label="Store Name" required value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
        <div>
          <label className="text-sm font-medium text-ink">Store Type</label>
          <select
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={form.storeType}
            onChange={(e) => setForm({ ...form, storeType: e.target.value })}
          >
            <option value="restaurant">Restaurant</option>
            <option value="grocery">Grocery Store</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="ecommerce">E-commerce Seller</option>
            <option value="local_shop">Local Shop</option>
          </select>
        </div>
        <Input label="Contact Email" type="email" required value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        <Input label="Contact Phone" required value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
        <Input label="Address" required value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="City" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="Pincode" required value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
        </div>
        <Input label="GST Number (optional)" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
        <Input label="PAN Number (optional)" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Application"}
        </Button>
      </form>
    </div>
  );
}
