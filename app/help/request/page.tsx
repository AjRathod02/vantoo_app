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
  { value: "product", label: "Product Help" },
  { value: "account", label: "Account" },
  { value: "orders", label: "Orders" },
  { value: "payment", label: "Payments" },
  { value: "refund", label: "Refunds" },
  { value: "delivery", label: "Delivery" },
  { value: "wallet", label: "Wallet" },
  { value: "coupons", label: "Coupons" },
  { value: "technical", label: "Technical Support" },
  { value: "returns", label: "Returns" },
  { value: "general", label: "General" },
];

export default function HelpRequestPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useHydrated();
  const [category, setCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (hydrated && !user) {
    router.replace("/login?redirect=/help/request");
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
          kind: "help",
          category,
          subject,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Ticket ${data.ticket.ticketNumber} created`);
      router.push(`/help/complaints/${data.ticket.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create ticket");
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
        <h1 className="mt-2 text-3xl font-bold text-ink">Support Request</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Generates a Help Ticket ID like HELP-20260710-000412.
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-card"
      >
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
          placeholder="Describe what you need help with"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />
        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Creating..." : "Create Help Ticket"}
        </Button>
      </form>
    </div>
  );
}
