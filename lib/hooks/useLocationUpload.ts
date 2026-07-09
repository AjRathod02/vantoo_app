"use client";

import { useCallback, useRef } from "react";
import type { DeviceLocation, LocationRole } from "@/lib/types";

export interface UploadLocationOptions {
  role: LocationRole;
  orderId?: string;
  city?: string;
  online?: boolean;
}

export function useLocationUpload() {
  const inflight = useRef(false);
  const queue = useRef<DeviceLocation | null>(null);

  const upload = useCallback(
    async (device: DeviceLocation, options: UploadLocationOptions) => {
      queue.current = device;
      if (inflight.current) return;

      inflight.current = true;
      const payload = queue.current;
      queue.current = null;

      if (!payload) {
        inflight.current = false;
        return;
      }

      try {
        await fetch("/api/location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-vantoo-portal": options.role,
          },
          body: JSON.stringify({
            latitude: payload.latitude,
            longitude: payload.longitude,
            accuracy: payload.accuracy,
            speed: payload.speed,
            heading: payload.heading,
            altitude: payload.altitude,
            timestamp: payload.timestamp,
            role: options.role,
            orderId: options.orderId,
            city: options.city,
            online: options.online,
          }),
        });

        if (options.role === "rider" && options.orderId) {
          await fetch("/api/rider/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: options.orderId,
              lat: payload.latitude,
              lng: payload.longitude,
              speed: payload.speed,
              heading: payload.heading,
              timestamp: payload.timestamp,
            }),
          }).catch(() => undefined);
        }
      } catch {
        // retry on next tick
      } finally {
        inflight.current = false;
        if (queue.current) {
          upload(queue.current, options);
        }
      }
    },
    []
  );

  return { upload };
}
