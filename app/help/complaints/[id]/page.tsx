"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";
import { useAuthStore } from "@/lib/stores/auth";
import { useHydrated } from "@/lib/useHydrated";
import type { SupportTicket } from "@/lib/support/service";

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useHydrated();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`/api/support?id=${params.id}`)
      .then((r) => r.json())
      .then((d) => setTicket(d.ticket ?? null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace(`/login?redirect=/help/complaints/${params.id}`);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user, params.id]);

  const sendReply = async () => {
    if (!reply.trim() || !ticket) return;
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reply",
        ticketId: ticket.id,
        body: reply,
      }),
    });
    if (res.ok) {
      setReply("");
      toast.success("Reply sent");
      load();
    } else {
      toast.error("Could not send reply");
    }
  };

  if (!hydrated || !user) return null;

  return (
    <div className="container-page max-w-2xl space-y-6 py-8">
      <Link href="/help/complaints" className="text-sm text-brand-primary">
        ← My Complaints
      </Link>

      {loading || !ticket ? (
        <p className="text-ink-muted">{loading ? "Loading..." : "Not found"}</p>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm font-semibold text-brand-primary">
                {ticket.ticketNumber}
              </p>
              <Badge>{ticket.status.replace("_", " ")}</Badge>
              <Badge tone="gray">{ticket.priority}</Badge>
            </div>
            <h1 className="mt-3 text-xl font-bold text-ink">{ticket.subject}</h1>
            <p className="mt-2 text-sm text-ink-muted">{ticket.description}</p>
            <div className="mt-4 grid gap-2 text-xs text-ink-soft sm:grid-cols-2">
              <p>Category: {ticket.category.replace("_", " ")}</p>
              <p>Order: {ticket.orderId ?? "—"}</p>
              <p>
                Created: {new Date(ticket.createdAt).toLocaleString("en-IN")}
              </p>
              <p>
                Resolution timeline:{" "}
                {ticket.resolutionDueAt
                  ? new Date(ticket.resolutionDueAt).toLocaleString("en-IN")
                  : "—"}
              </p>
            </div>
            {ticket.resolution && (
              <p className="mt-4 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
                Resolution: {ticket.resolution}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
            <h2 className="font-semibold text-ink">Conversation</h2>
            <div className="mt-4 space-y-3">
              {ticket.replies.map((r) => (
                <div
                  key={r.id}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    r.authorType === "customer"
                      ? "bg-brand-surface"
                      : "bg-gray-50"
                  }`}
                >
                  <p className="text-xs font-medium text-ink-soft">
                    {r.authorName} ·{" "}
                    {new Date(r.createdAt).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-ink">{r.body}</p>
                </div>
              ))}
            </div>
            {!["resolved", "closed"].includes(ticket.status) && (
              <div className="mt-4 space-y-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                  placeholder="Write a reply..."
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
                <Button onClick={sendReply}>Send Reply</Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
