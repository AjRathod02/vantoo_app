"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/stores/toast";

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState("push");
  const [targetType, setTargetType] = useState("all");
  const [sending, setSending] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, channel, targetType }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send");
        return;
      }
      toast.success(data.message ?? "Notification sent");
      setTitle("");
      setBody("");
    } catch {
      toast.error("Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <AdminHeader title="Notifications" subtitle="Send push, email, and SMS notifications" />
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={send} className="max-w-xl space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm"
            >
              <option value="push">Push Notification</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Target</label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm"
            >
              <option value="all">All Users</option>
              <option value="customers">Customers</option>
              <option value="vendors">Vendors</option>
              <option value="riders">Riders</option>
            </select>
          </div>
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-brand-primary focus:outline-none"
              required
            />
          </div>
          <Button type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send Notification"}
          </Button>
        </form>
      </div>
    </>
  );
}
