"use client";

import { useEffect } from "react";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirebaseApp } from "@/lib/firebase/config";

export function FirebaseAnalytics() {
  useEffect(() => {
    void isSupported().then((supported) => {
      if (supported) {
        getAnalytics(getFirebaseApp());
      }
    });
  }, []);

  return null;
}
