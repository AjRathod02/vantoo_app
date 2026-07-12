"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";
import type { SupportTicket } from "@/lib/support/service";

function tone(status: string): "orange" | "green" | "red" | "gray" {
  if (status === "resolved" || status === "closed") return "green";
  if (status === "escalated") return "red";
  if (status === "in_progress" || status === "assigned") return "orange";
  return "gray";
}

export default function MyComplaintsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useHydrated();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login?redirect=/help/complaints");
      return;
    }
    fetch("/api/support?kind=complaint")
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets ?? []))
      .finally(() => setLoading(false));
  }, [hydrated, user, router]);

  if (!hydrated || !user) return null;

  return (
    <div className="container-page max-w-2xl space-y-6 py-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Link href="/help" className="text-sm text-brand-primary">
            ← Help Center
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-ink">My Complaints</h1>
        </div>
        <Link
          href="/help/complaint"
          className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
        >
          New Complaint
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-card">
        {loading ? (
          <p className="p-6 text-sm text-ink-muted">Loading...</p>
        ) : tickets.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-muted">
            No complaints yet.
          </p>
        ) : (
          tickets.map((t, i) => (
            <Link
              key={t.id}
              href={`/help/complaints/${t.id}`}
              className={`block px-5 py-4 hover:bg-gray-50 ${
                i !== 0 ? "border-t border-gray-100" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-brand-primary">
                    {t.ticketNumber}
                  </p>
                  <p className="mt-1 font-medium text-ink">{t.subject}</p>
                  <p className="text-xs text-ink-soft capitalize">
                    {t.category.replace("_", " ")} ·{" "}
                    {new Date(t.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <Badge tone={tone(t.status)}>{t.status.replace("_", " ")}</Badge>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
