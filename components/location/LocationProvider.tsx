"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { useLocationStore } from "@/lib/stores/location";
import {
  useDeviceLocation,
  useLocationPermission,
} from "@/lib/hooks/useDeviceLocation";
import { useLocationUpload } from "@/lib/hooks/useLocationUpload";
import { LocationPermissionPrompt } from "@/components/location/LocationPermissionPrompt";
import type { DeviceLocation, LocationRole } from "@/lib/types";

function roleFromPath(pathname: string, userRole?: string): LocationRole {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/rider")) return "rider";
  if (pathname.startsWith("/vendor")) return "vendor";
  if (userRole === "admin") return "admin";
  return "customer";
}

function shouldTrack(pathname: string, loggedIn: boolean): boolean {
  if (!loggedIn) return false;
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    return false;
  }
  return true;
}

function shouldDisplayCity(pathname: string): boolean {
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/rider") ||
    pathname.startsWith("/vendor") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  ) {
    return false;
  }
  return true;
}

function requiresPermission(role: LocationRole, pathname: string): boolean {
  if (role === "rider") return true;
  if (pathname.includes("/track")) return true;
  if (pathname.startsWith("/checkout")) return true;
  return false;
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const {
    setPermission,
    sharingEnabled,
    setSharingEnabled,
    setPosition,
    setRole,
    setError,
    setLastUploadedAt,
    setSharingRequired,
    activeOrderId,
  } = useLocationStore();

  const {
    permission: browserPermission,
    error: permissionError,
    requestPermission,
    setError: setPermissionUiError,
  } = useLocationPermission();

  const { upload } = useLocationUpload();
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const autoRequestedRef = useRef(false);

  const role = useMemo(
    () => roleFromPath(pathname, user?.role),
    [pathname, user?.role]
  );

  const tracking = useMemo(
    () => Boolean(user) && shouldTrack(pathname, Boolean(user)),
    [user, pathname]
  );

  const displayCity = useMemo(() => shouldDisplayCity(pathname), [pathname]);

  const mandatory = useMemo(
    () => requiresPermission(role, pathname),
    [role, pathname]
  );

  useEffect(() => {
    setRole(role);
    setSharingRequired(mandatory);
  }, [role, mandatory, setRole, setSharingRequired]);

  useEffect(() => {
    setPermission(browserPermission);
    if (permissionError) setError(permissionError);
  }, [browserPermission, permissionError, setPermission, setError]);

  useEffect(() => {
    if (browserPermission === "granted") {
      setSharingEnabled(true);
      return;
    }

    if (!user || !tracking || promptDismissed) return;
    if (browserPermission === "prompt" || (mandatory && browserPermission === "denied")) {
      setPromptOpen(true);
    }
  }, [
    user,
    tracking,
    browserPermission,
    mandatory,
    promptDismissed,
    setSharingEnabled,
  ]);

  useEffect(() => {
    if (!displayCity || user || browserPermission !== "prompt") return;
    if (autoRequestedRef.current) return;
    autoRequestedRef.current = true;

    void requestPermission().then((ok) => {
      if (ok) setSharingEnabled(true);
    });
  }, [displayCity, user, browserPermission, requestPermission, setSharingEnabled]);

  const active =
    sharingEnabled &&
    browserPermission === "granted" &&
    (displayCity || tracking);

  const handleLocationUpdate = useCallback(
    (device: DeviceLocation) => {
      setPosition(device);
      if (!user) return;
      upload(device, {
        role,
        orderId: activeOrderId ?? undefined,
        online: true,
      }).then(() => setLastUploadedAt(new Date().toISOString()));
    },
    [user, role, activeOrderId, setPosition, upload, setLastUploadedAt]
  );

  const { error: watchError } = useDeviceLocation({
    enabled: active,
    intervalMs: role === "rider" ? 4000 : 5000,
    background: role === "rider",
    onUpdate: handleLocationUpdate,
  });

  useEffect(() => {
    if (watchError) setError(watchError);
  }, [watchError, setError]);

  const handleAllow = async () => {
    const ok = await requestPermission();
    if (ok) {
      setSharingEnabled(true);
      setPromptOpen(false);
      setPermissionUiError(null);
    }
  };

  return (
    <>
      {children}
      <LocationPermissionPrompt
        open={promptOpen && Boolean(user)}
        role={role}
        denied={browserPermission === "denied"}
        onAllow={handleAllow}
        onDismiss={() => {
          setPromptOpen(false);
          setPromptDismissed(true);
        }}
      />
    </>
  );
}
