"use client";

import { memo, useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoPoint } from "@/lib/types";

export interface LiveMapController {
  zoomIn: () => void;
  zoomOut: () => void;
  centerCustomer: () => void;
  invalidate: () => void;
}

export interface LiveMapCanvasProps {
  controllerRef: { current: LiveMapController | null };
  store: GeoPoint & { name?: string };
  customer: GeoPoint;
  rider: GeoPoint | null;
  heading: number;
  completedPath: GeoPoint[];
  remainingPath: GeoPoint[];
  showDeliveryRadius: boolean;
  darkMode: boolean;
  extraMarkers?: Array<{
    point: GeoPoint;
    label: string;
    title?: string;
  }>;
  hideDefaultMarkers?: boolean;
}

function emojiIcon(emoji: string, ring = "#FF6B00") {
  return L.divIcon({
    className: "vantoo-map-marker",
    html: `<div style="width:40px;height:40px;border-radius:9999px;background:#fff;border:3px solid ${ring};display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 6px 16px rgba(0,0,0,0.2)">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function riderIcon(heading: number) {
  return L.divIcon({
    className: "vantoo-map-marker",
    html: `<div style="width:44px;height:44px;border-radius:9999px;background:#FF6B00;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(255,107,0,0.45)">
        <span style="font-size:20px;display:inline-block;transform:rotate(${heading}deg)">🛵</span>
      </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function toLatLng(p: GeoPoint): [number, number] {
  return [p.lat, p.lng];
}

function MapBridge({
  controllerRef,
  store,
  customer,
  rider,
  extraMarkers,
}: {
  controllerRef: LiveMapCanvasProps["controllerRef"];
  store: GeoPoint;
  customer: GeoPoint;
  rider: GeoPoint | null;
  extraMarkers?: LiveMapCanvasProps["extraMarkers"];
}) {
  const map = useMap();

  useEffect(() => {
    controllerRef.current = {
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
      centerCustomer: () => map.setView(toLatLng(customer), 15),
      invalidate: () => map.invalidateSize(),
    };
    return () => {
      controllerRef.current = null;
    };
  }, [map, controllerRef, customer]);

  useEffect(() => {
    const points = [
      store,
      customer,
      rider,
      ...(extraMarkers?.map((m) => m.point) ?? []),
    ].filter(Boolean) as GeoPoint[];
    if (points.length < 1) return;
    const bounds = L.latLngBounds(points.map(toLatLng));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.lat, store.lng, customer.lat, customer.lng, extraMarkers?.length]);

  return null;
}

export const LiveMapCanvas = memo(function LiveMapCanvas({
  controllerRef,
  store,
  customer,
  rider,
  heading,
  completedPath,
  remainingPath,
  showDeliveryRadius,
  darkMode,
  extraMarkers,
  hideDefaultMarkers = false,
}: LiveMapCanvasProps) {
  const tileUrl = darkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const center = useMemo(() => toLatLng(customer), [customer]);

  return (
    <MapContainer
      center={center}
      zoom={14}
      zoomControl={false}
      attributionControl={false}
      className="h-full min-h-[420px] w-full"
      style={{ background: darkMode ? "#1a1a1a" : "#e8f4ea" }}
    >
      <TileLayer
        url={tileUrl}
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />

      <MapBridge
        controllerRef={controllerRef}
        store={store}
        customer={customer}
        rider={rider}
        extraMarkers={extraMarkers}
      />

      {showDeliveryRadius && (
        <Circle
          center={toLatLng(store)}
          radius={3500}
          pathOptions={{
            color: "#FF6B00",
            fillColor: "#FF6B00",
            fillOpacity: 0.08,
            weight: 1,
            opacity: 0.35,
          }}
        />
      )}

      {remainingPath.length > 1 && (
        <Polyline
          positions={remainingPath.map(toLatLng)}
          pathOptions={{ color: "#9CA3AF", weight: 5, opacity: 0.9 }}
        />
      )}
      {completedPath.length > 1 && (
        <Polyline
          positions={completedPath.map(toLatLng)}
          pathOptions={{ color: "#FF6B00", weight: 5, opacity: 1 }}
        />
      )}

      {!hideDefaultMarkers && (
        <Marker position={toLatLng(store)} icon={emojiIcon("🏪")} />
      )}
      {!hideDefaultMarkers && (
        <>
          <Marker position={toLatLng(customer)} icon={emojiIcon("📍", "#E63946")} />
          {rider && (
            <Marker position={toLatLng(rider)} icon={riderIcon(heading)} />
          )}
        </>
      )}
      {extraMarkers?.map((marker, i) => (
        <Marker
          key={`${marker.title ?? marker.label}-${i}`}
          position={toLatLng(marker.point)}
          icon={emojiIcon(marker.label)}
          title={marker.title}
        />
      ))}
    </MapContainer>
  );
});
