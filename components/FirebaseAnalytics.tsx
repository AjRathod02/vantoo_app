"use client";

import { useEffect } from "react";
import { getFirebaseApp } from "@/lib/firebase/config";

export function FirebaseAnalytics() {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { getAnalytics, isSupported } = await import("firebase/analytics");
        if (cancelled) return;
        if (await isSupported()) {
          getAnalytics(getFirebaseApp());
        }
      } catch {
        // Analytics is optional; ignore load failures in local/dev.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
