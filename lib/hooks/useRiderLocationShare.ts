"use client";

import { useEffect, useRef } from "react";

interface RiderLocationShareOptions {
  orderId: string;
  enabled?: boolean;
  intervalMs?: number;
}

export function useRiderLocationShare({
  orderId,
  enabled = true,
  intervalMs = 4000,
}: RiderLocationShareOptions) {
  const watchId = useRef<number | null>(null);
  const lastSent = useRef(0);

  useEffect(() => {
    if (!enabled || !orderId || !navigator.geolocation) return;

    const send = (position: GeolocationPosition) => {
      const now = Date.now();
      if (now - lastSent.current < intervalMs - 500) return;
      lastSent.current = now;

      const { latitude, longitude, speed, heading } = position.coords;

      fetch("/api/rider/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          lat: latitude,
          lng: longitude,
          speed: speed != null ? Math.round(speed * 3.6) : undefined,
          heading: heading != null ? Math.round(heading) : undefined,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // best-effort upload
      });
    };

    watchId.current = navigator.geolocation.watchPosition(send, () => undefined, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 10000,
    });

    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [orderId, enabled, intervalMs]);
}
