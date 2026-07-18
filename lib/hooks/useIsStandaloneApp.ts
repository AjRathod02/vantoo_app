"use client";

import { useEffect, useState } from "react";

/**
 * True when the customer experience is running as an installed PWA / home-screen app
 * (display-mode: standalone), as opposed to a regular browser tab.
 */
export function useIsStandaloneApp(): boolean {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const iosStandalone =
      "standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    const sync = () => setStandalone(mq.matches || iosStandalone);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return standalone;
}
