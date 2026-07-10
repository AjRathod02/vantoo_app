"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/lib/stores/toast";

interface Ticket {
  id: string;
  ticket_number: string;
  user_name: string;
  user_type: string;
  category: string;
  priority: string;
  subject: string;
  status: string;
  created_at: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function AdminComplaintsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = () =>
    fetch(`/api/admin/complaints${filter ? `?status=${filter}` : ""}`)
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets ?? []))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, [filter]);

  const updateStatus = async (ticketId: string, status: string) => {
    const res = await fetch("/api/admin/complaints", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, status }),
    });
    if (res.ok) {
      toast.success("Ticket updated");
      load();
    } else {
      toast.error("Update failed");
    }
  };

  return (
    <>
      <AdminHeader title="Support & Complaints" subtitle="Centralized complaint resolution" />
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {["", "open", "assigned", "in_progress", "resolved", "closed"].map((s) => (
            <button
              key={s || "all"}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                filter === s
                  ? "bg-brand-primary text-white"
                  : "bg-white text-ink-muted border border-gray-200"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-ink-muted">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="text-ink-muted">No support tickets.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs text-ink-soft">{t.ticket_number}</span>
                    <h3 className="font-semibold text-ink">{t.subject}</h3>
                    <p className="text-sm text-ink-muted">
                      {t.user_name} · {t.user_type} · {t.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[t.priority] ?? ""}`}
                    >
                      {t.priority}
                    </span>
                    <Badge>{t.status}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {t.status !== "in_progress" && (
                    <Button size="sm" onClick={() => updateStatus(t.id, "in_progress")}>
                      Start
                    </Button>
                  )}
                  {t.status !== "resolved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(t.id, "resolved")}
                    >
                      Resolve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(t.id, "closed")}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
