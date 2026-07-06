"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function RiderOnlineToggle({ initialStatus }: { initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    const next = status === "online" || status === "busy" ? "offline" : "online";
    setLoading(true);
    try {
      const res = await fetch("/api/rider/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) setStatus(next);
    } finally {
      setLoading(false);
    }
  }

  const isOnline = status === "online" || status === "busy";

  return (
    <Button
      variant={isOnline ? "secondary" : "primary"}
      size="sm"
      disabled={loading || status === "busy"}
      onClick={toggle}
    >
      {loading ? "Updating..." : isOnline ? "Go Offline" : "Go Online"}
    </Button>
  );
}
