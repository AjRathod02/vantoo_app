"use client";

import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import {
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  LocateFixed,
} from "lucide-react";
import type { GeoPoint, OrderStatus, RiderLocationUpdate } from "@/lib/types";
import { DEFAULT_STORE } from "@/lib/tracking/geo";
import { cn } from "@/lib/utils";
import { MapStatusBanner } from "@/components/tracking/MapStatusBanner";
import { TrackingNotification } from "@/components/tracking/TrackingNotification";
import type { LiveMapCanvasProps } from "@/components/tracking/LiveMapCanvas";

const LiveMapCanvas = dynamic(
  () =>
    import("@/components/tracking/LiveMapCanvas").then((m) => m.LiveMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full min-h-[420px] w-full place-items-center bg-[#e8f4ea] dark:bg-[#1a1a1a]">
        <p className="text-sm text-ink-muted">Loading map…</p>
      </div>
    ),
  }
);

export interface LiveTrackingMapProps {
  className?: string;
  status: OrderStatus;
  store?: GeoPoint & { name?: string };
  customer?: GeoPoint;
  rider?: RiderLocationUpdate | null;
  showRoute?: boolean;
  showDeliveryRadius?: boolean;
  notification?: string | null;
  darkMode?: boolean;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export const LiveTrackingMap = memo(function LiveTrackingMap({
  className,
  status,
  store,
  customer,
  rider,
  showRoute = true,
  showDeliveryRadius = true,
  notification,
  darkMode = false,
}: LiveTrackingMapProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [routePath, setRoutePath] = useState<GeoPoint[]>([]);
  const [animatedRider, setAnimatedRider] = useState<GeoPoint | null>(null);
  const animRef = useRef<number>();
  const controllerRef = useRef<LiveMapCanvasProps["controllerRef"]["current"]>(null);

  const storePoint = useMemo<GeoPoint & { name?: string }>(
    () => store ?? DEFAULT_STORE,
    [store]
  );
  const customerPoint = useMemo<GeoPoint>(
    () =>
      customer ?? {
        lat: storePoint.lat + 0.012,
        lng: storePoint.lng + 0.018,
      },
    [customer, storePoint]
  );
  const riderPoint = useMemo<GeoPoint>(
    () =>
      animatedRider ??
      (rider ? { lat: rider.lat, lng: rider.lng } : storePoint),
    [animatedRider, rider, storePoint]
  );

  useEffect(() => {
    if (!rider) return;
    const from = animatedRider ?? { lat: rider.lat, lng: rider.lng };
    const to = { lat: rider.lat, lng: rider.lng };
    const start = performance.now();
    const duration = 1000;

    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setAnimatedRider({
        lat: lerp(from.lat, to.lat, t),
        lng: lerp(from.lng, to.lng, t),
      });
      if (t < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rider?.lat, rider?.lng]);

  useEffect(() => {
    if (!showRoute) {
      setRoutePath([]);
      return;
    }
    let active = true;
    const origin = `${storePoint.lat},${storePoint.lng}`;
    const destination = `${customerPoint.lat},${customerPoint.lng}`;

    fetch(
      `/api/maps/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.path?.length > 1) setRoutePath(data.path);
        else setRoutePath([storePoint, customerPoint]);
      })
      .catch(() => {
        if (active) setRoutePath([storePoint, customerPoint]);
      });

    return () => {
      active = false;
    };
  }, [showRoute, storePoint, customerPoint]);

  const { completedPath, remainingPath } = useMemo(() => {
    if (routePath.length < 2) {
      return { completedPath: [] as GeoPoint[], remainingPath: routePath };
    }
    const totalKm = rider?.distanceKm ?? 2.8;
    const remainingM = rider?.distanceRemainingM ?? totalKm * 1000;
    const progress = Math.min(
      1,
      Math.max(0, 1 - remainingM / Math.max(totalKm * 1000, 1))
    );
    const splitIndex = Math.max(
      1,
      Math.min(routePath.length - 1, Math.floor(routePath.length * progress))
    );
    return {
      completedPath: routePath.slice(0, splitIndex + 1),
      remainingPath: routePath.slice(splitIndex),
    };
  }, [routePath, rider?.distanceKm, rider?.distanceRemainingM]);

  const showRider =
    status === "assigned" || status === "picked" || status === "in_transit";

  const containerClass = cn(
    "relative overflow-hidden rounded-2xl border border-gray-200 bg-[#e8f4ea] dark:border-gray-700 dark:bg-[#1a1a1a]",
    fullscreen && "fixed inset-0 z-[100] rounded-none border-0",
    className
  );

  return (
    <div className={containerClass}>
      <TrackingNotification message={notification ?? null} />
      <MapStatusBanner
        status={status}
        distanceRemainingM={rider?.distanceRemainingM}
        etaMinutes={rider?.etaMinutes}
      />

      <LiveMapCanvas
        controllerRef={controllerRef}
        store={storePoint}
        customer={customerPoint}
        rider={showRider ? riderPoint : null}
        heading={rider?.heading ?? 0}
        completedPath={completedPath}
        remainingPath={remainingPath}
        showDeliveryRadius={showDeliveryRadius && !showRoute}
        darkMode={darkMode}
      />

      <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => controllerRef.current?.zoomIn()}
          className="grid h-10 w-10 place-items-center rounded-xl bg-white text-ink shadow-card hover:bg-gray-50 dark:bg-ink dark:text-white"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => controllerRef.current?.zoomOut()}
          className="grid h-10 w-10 place-items-center rounded-xl bg-white text-ink shadow-card hover:bg-gray-50 dark:bg-ink dark:text-white"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Center on my location"
          onClick={() => controllerRef.current?.centerCustomer()}
          className="grid h-10 w-10 place-items-center rounded-xl bg-white text-ink shadow-card hover:bg-gray-50 dark:bg-ink dark:text-white"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={fullscreen ? "Exit full screen" : "Full screen"}
          onClick={() => {
            setFullscreen((v) => !v);
            setTimeout(() => controllerRef.current?.invalidate(), 120);
          }}
          className="grid h-10 w-10 place-items-center rounded-xl bg-white text-ink shadow-card hover:bg-gray-50 dark:bg-ink dark:text-white"
        >
          {fullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {rider?.etaMinutes != null && (
        <div className="absolute bottom-4 left-4 z-[400] rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white shadow-cardHover">
          ETA {rider.etaMinutes} min
          {rider.speed != null ? ` · ${Math.round(rider.speed)} km/h` : ""}
        </div>
      )}
    </div>
  );
});
