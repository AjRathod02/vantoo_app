"use client";

import { useEffect, useRef } from "react";
import { reverseGeocode } from "@/lib/location/reverseGeocode";
import { useLocationStore } from "@/lib/stores/location";

const DEFAULT_CITY = "Bengaluru";

export function useResolvedCity() {
  const position = useLocationStore((s) => s.position);
  const cityName = useLocationStore((s) => s.cityName);
  const areaName = useLocationStore((s) => s.areaName);
  const setResolvedPlace = useLocationStore((s) => s.setResolvedPlace);
  const lastKey = useRef("");

  useEffect(() => {
    if (!position) return;
    const key = `${position.latitude.toFixed(4)},${position.longitude.toFixed(4)}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    reverseGeocode(position.latitude, position.longitude).then((place) => {
      if (place) {
        setResolvedPlace(place.city, place.area);
      }
    });
  }, [position, setResolvedPlace]);

  return {
    city: cityName || DEFAULT_CITY,
    area: areaName,
    hasGps: Boolean(position),
  };
}
