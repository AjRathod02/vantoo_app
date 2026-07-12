"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/lib/stores/toast";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";

const CATEGORIES = [
  { value: "orders", label: "Orders" },
  { value: "payment", label: "Payments" },
  { value: "refund", label: "Refunds" },
  { value: "delivery", label: "Delivery" },
  { value: "rider", label: "Rider" },
  { value: "vendor", label: "Vendor" },
  { value: "product_quality", label: "Product Quality" },
  { value: "technical", label: "Technical Issues" },
  { value: "general", label: "General Support" },
];

export default function RaiseComplaintPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useHydrated();
  const [category, setCategory] = useState("orders");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [orderId, setOrderId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [attachments, setAttachments] = useState("");
  const [loading, setLoading] = useState(false);

  if (hydrated && !user) {
    router.replace("/login?redirect=/help/complaint");
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "complaint",
          category,
          subject,
          description,
          orderId: orderId || undefined,
          priority,
          attachments: attachments
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Complaint ${data.ticket.ticketNumber} submitted`);
      router.push(`/help/complaints/${data.ticket.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page max-w-xl space-y-6 py-8">
      <div>
        <Link href="/help" className="text-sm text-brand-primary">
          ← Help Center
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-ink">Raise a Complaint</h1>
        <p className="mt-1 text-sm text-ink-muted">
          You&apos;ll receive a Complaint ID like CMP-20260710-000125 to track progress.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
        <label className="block text-sm">
          <span className="text-ink-muted">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <Input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <textarea
          placeholder="Describe the issue in detail"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
        />
        <Input
          placeholder="Order ID (if applicable)"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <label className="block text-sm">
          <span className="text-ink-muted">Priority</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-gray-200 px-3"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-ink-muted">
            Image / video / document URLs (one per line)
          </span>
          <textarea
            placeholder="https://..."
            value={attachments}
            onChange={(e) => setAttachments(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Submitting..." : "Submit Complaint"}
        </Button>
      </form>
    </div>
  );
}
