"use client";

import dynamic from "next/dynamic";
import type { OrderStatus, RiderLocationUpdate } from "@/lib/types";

const LiveTrackingMap = dynamic(
  () =>
    import("@/components/tracking/LiveTrackingMap").then(
      (m) => m.LiveTrackingMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[200px] w-full animate-pulse place-items-center rounded-2xl bg-[#e8f4ea] text-sm text-ink-muted">
        Loading map…
      </div>
    ),
  }
);

type Props = {
  className?: string;
  showRoute?: boolean;
  status?: OrderStatus;
  riderLat?: number;
  riderLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  storeLat?: number;
  storeLng?: number;
  rider?: RiderLocationUpdate | null;
  notification?: string | null;
};

export function LiveOrderMap({
  className,
  showRoute = false,
  status = "confirmed",
  riderLat,
  riderLng,
  destinationLat,
  destinationLng,
  storeLat,
  storeLng,
  rider,
  notification,
}: Props) {
  const resolvedRider =
    rider ??
    (riderLat != null && riderLng != null
      ? { orderId: "", lat: riderLat, lng: riderLng }
      : null);

  return (
    <LiveTrackingMap
      className={className}
      status={status}
      showRoute={showRoute}
      showDeliveryRadius={!showRoute}
      store={
        storeLat != null && storeLng != null
          ? { lat: storeLat, lng: storeLng }
          : undefined
      }
      customer={
        destinationLat != null && destinationLng != null
          ? { lat: destinationLat, lng: destinationLng }
          : undefined
      }
      rider={resolvedRider}
      notification={notification}
    />
  );
}
