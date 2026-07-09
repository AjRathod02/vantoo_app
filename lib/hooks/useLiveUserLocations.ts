"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { LocationRole, UserLocationRecord } from "@/lib/types";

function socketUrl() {
  if (typeof window === "undefined") return null;
  return (
    process.env.NEXT_PUBLIC_TRACKING_SOCKET_URL ??
    process.env.NEXT_PUBLIC_TRACKING_SERVICE_URL ??
    null
  );
}

export function useLiveUserLocations(options?: {
  scope?: "admin" | "self";
  userId?: string;
  role?: LocationRole;
  city?: string;
  online?: boolean;
}) {
  const [locations, setLocations] = useState<UserLocationRecord[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const upsert = useCallback((record: UserLocationRecord) => {
    setLocations((prev) => {
      const idx = prev.findIndex((r) => r.userId === record.userId);
      if (idx === -1) return [record, ...prev];
      const next = [...prev];
      next[idx] = record;
      return next;
    });
  }, []);

  useEffect(() => {
    let active = true;
    let eventSource: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const params = new URLSearchParams();
    if (options?.scope === "admin") params.set("scope", "admin");
    if (options?.userId) params.set("userId", options.userId);
    if (options?.role) params.set("role", options.role);
    if (options?.city) params.set("city", options.city);
    if (options?.online != null) params.set("online", String(options.online));

    const startSse = () => {
      if (!active) return;
      eventSource = new EventSource(`/api/location/stream?${params}`);
      eventSource.onopen = () => active && setConnected(true);
      eventSource.onmessage = (event) => {
        try {
          upsert(JSON.parse(event.data) as UserLocationRecord);
        } catch {
          // ignore
        }
      };
      eventSource.onerror = () => {
        setConnected(false);
        eventSource?.close();
        startPoll();
      };
    };

    const startPoll = () => {
      if (!active || pollTimer) return;
      const endpoint =
        options?.scope === "admin"
          ? `/api/admin/locations?${params}`
          : `/api/location?userId=${options?.userId ?? ""}`;

      const poll = async () => {
        try {
          const res = await fetch(endpoint);
          if (!res.ok) return;
          const json = await res.json();
          if (options?.scope === "admin") {
            setLocations(json.locations ?? []);
          } else if (json.location) {
            upsert(json.location);
          }
          setConnected(true);
        } catch {
          setConnected(false);
        }
      };
      poll();
      pollTimer = setInterval(poll, 5000);
    };

    const url = socketUrl();
    if (url && options?.scope === "admin") {
      const socket = io(url, { transports: ["websocket", "polling"] });
      socketRef.current = socket;
      socket.on("connect", () => {
        if (!active) return;
        setConnected(true);
        socket.emit("join-admin");
      });
      socket.on("user-location", (record: UserLocationRecord) => {
        if (options?.role && record.role !== options.role) return;
        if (options?.city && record.city !== options.city) return;
        upsert(record);
      });
      socket.on("rider-location", (payload: { orderId: string; lat: number; lng: number }) => {
        upsert({
          userId: `order:${payload.orderId}`,
          role: "rider",
          latitude: payload.lat,
          longitude: payload.lng,
          timestamp: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          orderId: payload.orderId,
        });
      });
      socket.on("connect_error", () => {
        socket.disconnect();
        startSse();
      });
    } else {
      startSse();
    }

    return () => {
      active = false;
      socketRef.current?.disconnect();
      eventSource?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [
    options?.scope,
    options?.userId,
    options?.role,
    options?.city,
    options?.online,
    upsert,
  ]);

  return { locations, connected };
}
