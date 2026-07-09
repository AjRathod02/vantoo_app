"use client";

import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(
  target: number,
  duration = 450,
  enabled = true
): number {
  const [display, setDisplay] = useState(target);
  const frameRef = useRef<number>();
  const startRef = useRef({ value: target, time: 0 });

  useEffect(() => {
    if (!enabled) {
      setDisplay(target);
      return;
    }

    const from = display;
    if (from === target) return;

    startRef.current = { value: from, time: performance.now() };

    const animate = (now: number) => {
      const elapsed = now - startRef.current.time;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(
        startRef.current.value + (target - startRef.current.value) * eased
      );

      setDisplay(next);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, enabled]);

  return enabled ? display : target;
}
