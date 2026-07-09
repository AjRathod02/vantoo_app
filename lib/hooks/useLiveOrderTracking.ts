"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Order, RiderLocationUpdate } from "@/lib/types";

function trackingSocketUrl() {
  if (typeof window === "undefined") return null;
  return (
    process.env.NEXT_PUBLIC_TRACKING_SOCKET_URL ??
    process.env.NEXT_PUBLIC_TRACKING_SERVICE_URL ??
    null
  );
}

export interface LiveTrackingState {
  location: RiderLocationUpdate | null;
  connected: boolean;
  transport: "socket" | "sse" | "poll" | null;
}

export function useLiveOrderTracking(
  orderId: string,
  initial?: Order["tracking"]
) {
  const [location, setLocation] = useState<RiderLocationUpdate | null>(() =>
    initial?.riderLat && initial?.riderLng
      ? {
          orderId,
          lat: initial.riderLat,
          lng: initial.riderLng,
          speed: initial.riderSpeed,
          heading: initial.riderHeading,
          timestamp: initial.updatedAt,
          riderName: initial.riderName,
          riderPhone: initial.riderPhone,
          riderRating: initial.riderRating,
          etaMinutes: initial.etaMinutes,
          distanceKm: initial.distanceKm,
          distanceRemainingM: initial.distanceRemainingM,
        }
      : null
  );
  const [connected, setConnected] = useState(false);
  const [transport, setTransport] = useState<
    LiveTrackingState["transport"]
  >(null);
  const socketRef = useRef<Socket | null>(null);

  const applyUpdate = useCallback((update: RiderLocationUpdate) => {
    setLocation((prev) => ({ ...prev, ...update, orderId }));
  }, [orderId]);

  useEffect(() => {
    let active = true;
    let eventSource: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const socketUrl = trackingSocketUrl();

    const startSse = () => {
      if (!active) return;
      setTransport("sse");
      eventSource = new EventSource(
        `/api/orders/${encodeURIComponent(orderId)}/tracking/stream`
      );
      eventSource.onopen = () => active && setConnected(true);
      eventSource.onmessage = (event) => {
        try {
          applyUpdate(JSON.parse(event.data) as RiderLocationUpdate);
        } catch {
          // ignore malformed payloads
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
      setTransport("poll");
      const poll = async () => {
        try {
          const res = await fetch(
            `/api/orders/${encodeURIComponent(orderId)}/tracking`
          );
          if (!res.ok) return;
          const json = await res.json();
          const t = json.tracking;
          if (t?.riderLat && t?.riderLng) {
            applyUpdate({
              orderId,
              lat: t.riderLat,
              lng: t.riderLng,
              speed: t.riderSpeed,
              heading: t.riderHeading,
              timestamp: t.updatedAt,
              riderName: t.riderName,
              riderPhone: t.riderPhone,
              riderRating: t.riderRating,
              etaMinutes: t.etaMinutes,
              distanceKm: t.distanceKm,
              distanceRemainingM: t.distanceRemainingM,
            });
            setConnected(true);
          }
        } catch {
          setConnected(false);
        }
      };
      poll();
      pollTimer = setInterval(poll, 4000);
    };

    if (socketUrl) {
      setTransport("socket");
      const socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        path: "/socket.io",
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        if (!active) return;
        setConnected(true);
        socket.emit("join-order", orderId);
      });

      socket.on("disconnect", () => active && setConnected(false));

      socket.on("rider-location", (payload: RiderLocationUpdate) => {
        if (payload.orderId === orderId) applyUpdate(payload);
      });

      socket.on("connect_error", () => {
        socket.disconnect();
        socketRef.current = null;
        startSse();
      });
    } else {
      startSse();
    }

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
      eventSource?.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [orderId, applyUpdate]);

  return { location, connected, transport };
}

export function useTrackingNotifications(
  orderId: string,
  status: Order["status"],
  location: RiderLocationUpdate | null
) {
  const [message, setMessage] = useState<string | null>(null);
  const prevStatus = useRef(status);
  const prevDistance = useRef<number | null>(null);

  useEffect(() => {
    if (status !== prevStatus.current) {
      if (status === "picked") setMessage("Rider picked up your order");
      if (status === "in_transit") setMessage("Rider is on the way");
      if (status === "delivered") setMessage("Order delivered!");
      prevStatus.current = status;
    }
  }, [status]);

  useEffect(() => {
    const meters = location?.distanceRemainingM;
    if (meters == null) return;

    const prev = prevDistance.current;
    prevDistance.current = meters;

    if (prev == null) return;
    if (prev > 1000 && meters <= 1000) setMessage("Rider is 1 km away");
    if (prev > 250 && meters <= 250) setMessage("Rider is arriving");
  }, [location?.distanceRemainingM]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  return { message, orderId };
}
