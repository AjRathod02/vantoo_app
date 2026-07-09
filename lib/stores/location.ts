"use client";

import { create } from "zustand";
import type {
  DeviceLocation,
  LocationPermissionState,
  LocationRole,
} from "@/lib/types";

interface LocationState {
  permission: LocationPermissionState;
  position: DeviceLocation | null;
  cityName: string | null;
  areaName: string | null;
  sharingEnabled: boolean;
  sharingRequired: boolean;
  role: LocationRole;
  error: string | null;
  lastUploadedAt: string | null;
  activeOrderId: string | null;
  setPermission: (permission: LocationPermissionState) => void;
  setPosition: (position: DeviceLocation | null) => void;
  setResolvedPlace: (city: string, area: string) => void;
  setSharingEnabled: (enabled: boolean) => void;
  setSharingRequired: (required: boolean) => void;
  setRole: (role: LocationRole) => void;
  setError: (error: string | null) => void;
  setLastUploadedAt: (at: string | null) => void;
  setActiveOrderId: (orderId: string | null) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  permission: "prompt",
  position: null,
  cityName: null,
  areaName: null,
  sharingEnabled: false,
  sharingRequired: false,
  role: "customer",
  error: null,
  lastUploadedAt: null,
  activeOrderId: null,
  setPermission: (permission) => set({ permission }),
  setPosition: (position) => set({ position }),
  setResolvedPlace: (cityName, areaName) => set({ cityName, areaName }),
  setSharingEnabled: (sharingEnabled) => set({ sharingEnabled }),
  setSharingRequired: (sharingRequired) => set({ sharingRequired }),
  setRole: (role) => set({ role }),
  setError: (error) => set({ error }),
  setLastUploadedAt: (lastUploadedAt) => set({ lastUploadedAt }),
  setActiveOrderId: (activeOrderId) => set({ activeOrderId }),
}));
