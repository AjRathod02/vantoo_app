"use client";

import { memo, useMemo } from "react";
import dynamic from "next/dynamic";
import type { GeoPoint, UserLocationRecord } from "@/lib/types";

const LiveMapCanvas = dynamic(
  () =>
    import("@/components/tracking/LiveMapCanvas").then((m) => m.LiveMapCanvas),
  { ssr: false, loading: () => <div className="min-h-[480px] animate-pulse bg-gray-100" /> }
);

const ROLE_EMOJI: Record<string, string> = {
  customer: "📍",
  rider: "🛵",
  vendor: "🏪",
  admin: "👤",
};

function FleetMapInner({
  locations,
  className,
}: {
  locations: UserLocationRecord[];
  className?: string;
}) {
  const controllerRef = useMemo(() => ({ current: null }), []);

  const center = useMemo<GeoPoint>(() => {
    if (locations.length === 0) return { lat: 12.9716, lng: 77.5946 };
    const lat =
      locations.reduce((s, l) => s + l.latitude, 0) / locations.length;
    const lng =
      locations.reduce((s, l) => s + l.longitude, 0) / locations.length;
    return { lat, lng };
  }, [locations]);

  const primary = locations[0];

  return (
    <div className={className}>
      <LiveMapCanvas
        controllerRef={controllerRef}
        store={center}
        customer={primary ? { lat: primary.latitude, lng: primary.longitude } : center}
        rider={null}
        heading={0}
        completedPath={[]}
        remainingPath={[]}
        showDeliveryRadius={false}
        darkMode={false}
        hideDefaultMarkers
        extraMarkers={locations.map((l) => ({
          point: { lat: l.latitude, lng: l.longitude },
          label: ROLE_EMOJI[l.role] ?? "📍",
          title: `${l.name ?? l.role} · ${l.role}`,
        }))}
      />
    </div>
  );
}

export const FleetLiveMap = memo(FleetMapInner);
