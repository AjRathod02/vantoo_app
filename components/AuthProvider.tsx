"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const syncSession = useAuthStore((s) => s.syncSession);

  useEffect(() => {
    syncSession().catch(() => {});
  }, [syncSession]);

  return <>{children}</>;
}
