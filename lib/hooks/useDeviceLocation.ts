"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DeviceLocation, LocationPermissionState } from "@/lib/types";

const ROLE_MESSAGES: Record<string, string> = {
  customer:
    "Vantoo uses your location to show nearby stores, set your delivery address accurately, and track your order in real time.",
  rider:
    "Vantoo needs your precise location to assign deliveries, navigate routes, and share live tracking with customers while you are online.",
  vendor:
    "Location helps Vantoo show your store on the map and coordinate pickups with nearby riders.",
  admin:
    "Location access helps verify delivery zones and monitor live operations on the map.",
};

export function getLocationPermissionMessage(role: string) {
  return ROLE_MESSAGES[role] ?? ROLE_MESSAGES.customer;
}

export function useLocationPermission() {
  const [permission, setPermission] =
    useState<LocationPermissionState>("prompt");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("unsupported");
      setError("Geolocation is not supported on this device.");
      return;
    }

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((result) => {
          if (result.state === "granted") setPermission("granted");
          else if (result.state === "denied") setPermission("denied");
          else setPermission("prompt");

          result.onchange = () => {
            if (result.state === "granted") setPermission("granted");
            else if (result.state === "denied") setPermission("denied");
            else setPermission("prompt");
          };
        })
        .catch(() => setPermission("prompt"));
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("unsupported");
      setError("Geolocation is not supported on this device.");
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermission("granted");
          setError(null);
          resolve(true);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setPermission("denied");
            setError(
              "Location permission denied. Enable it in your browser or device settings and try again."
            );
          } else {
            setError("Unable to get your location. Please try again.");
          }
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }, []);

  return { permission, error, requestPermission, setError };
}

function positionToDevice(pos: GeolocationPosition): DeviceLocation {
  const { latitude, longitude, accuracy, speed, heading, altitude } =
    pos.coords;
  return {
    latitude,
    longitude,
    accuracy: accuracy ?? undefined,
    speed: speed != null ? Number((speed * 3.6).toFixed(1)) : undefined,
    heading: heading != null ? Math.round(heading) : undefined,
    altitude: altitude ?? undefined,
    timestamp: new Date(pos.timestamp).toISOString(),
  };
}

function distanceMeters(a: DeviceLocation, b: DeviceLocation) {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface UseDeviceLocationOptions {
  enabled?: boolean;
  intervalMs?: number;
  background?: boolean;
  onUpdate?: (location: DeviceLocation) => void;
}

export function useDeviceLocation({
  enabled = true,
  intervalMs = 4000,
  background = false,
  onUpdate,
}: UseDeviceLocationOptions = {}) {
  const watchId = useRef<number | null>(null);
  const lastPosition = useRef<DeviceLocation | null>(null);
  const lastSent = useRef(0);
  const [position, setPosition] = useState<DeviceLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) {
      setWatching(false);
      return;
    }

    let watchActive = true;

    const handleVisibility = () => {
      watchActive = background || document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handle = (pos: GeolocationPosition) => {
      if (!watchActive) return;
      const device = positionToDevice(pos);
      const now = Date.now();
      const prev = lastPosition.current;

      const moved = !prev || distanceMeters(prev, device) > 8;
      const elapsed = now - lastSent.current >= intervalMs;

      if (!moved && !elapsed) return;

      lastPosition.current = device;
      lastSent.current = now;
      setPosition(device);
      setError(null);
      onUpdateRef.current?.(device);
    };

    const handleError = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) {
        setError("Location permission denied.");
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setError("GPS signal unavailable. Showing last known location.");
      } else {
        setError("Location request timed out. Retrying…");
      }
    };

    watchId.current = navigator.geolocation.watchPosition(handle, handleError, {
      enableHighAccuracy: true,
      maximumAge: 2000,
      timeout: 15000,
    });
    setWatching(true);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      setWatching(false);
    };
  }, [enabled, intervalMs, background]);

  return { position, error, watching, lastKnown: lastPosition.current };
}
