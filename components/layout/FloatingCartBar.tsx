"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { isCartSummaryHidden } from "@/lib/cart-routes";
import {
  selectCartSummary,
  useCartStore,
  type CartSummary,
} from "@/lib/stores/cart";
import { useHydrated } from "@/lib/useHydrated";
import { formatINR, cn } from "@/lib/utils";

const EXIT_MS = 300;

function useCartVisibility() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const hasItems = useCartStore((s) => s.items.length > 0);
  const hidden = isCartSummaryHidden(pathname);
  const shouldShow = hydrated && hasItems && !hidden;

  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"enter" | "idle" | "exit">("idle");

  useEffect(() => {
    if (shouldShow) {
      setVisible(true);
      setPhase("enter");
      const timer = window.setTimeout(() => setPhase("idle"), 350);
      return () => window.clearTimeout(timer);
    }

    if (visible) {
      setPhase("exit");
      const timer = window.setTimeout(() => {
        setVisible(false);
        setPhase("idle");
      }, EXIT_MS);
      return () => window.clearTimeout(timer);
    }
  }, [shouldShow, visible]);

  return { visible, phase, shouldShow };
}

const ViewCartButton = memo(function ViewCartButton() {
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  const handleClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    window.setTimeout(
      () => setRipples((prev) => prev.filter((r) => r.id !== id)),
      550
    );
  }, []);

  return (
    <Link
      href="/cart"
      onClick={handleClick}
      className="group relative inline-flex h-10 shrink-0 items-center gap-1.5 overflow-hidden rounded-full bg-white px-4 text-sm font-bold text-brand-primary transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-primary"
      aria-label="View cart and checkout"
    >
      <span>View Cart</span>
      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          aria-hidden
          className="pointer-events-none absolute h-8 w-8 rounded-full bg-brand-primary/20 animate-ripple"
          style={{ left: ripple.x - 16, top: ripple.y - 16 }}
        />
      ))}
    </Link>
  );
});

const CartSummaryContent = memo(function CartSummaryContent({
  summary,
  pulse,
}: {
  summary: CartSummary;
  pulse: boolean;
}) {
  const displayPrice = useMemo(
    () =>
      summary.discount > 0
        ? summary.subtotal - summary.discount
        : summary.subtotal,
    [summary.discount, summary.subtotal]
  );

  const itemLabel = summary.totalItems === 1 ? "Item" : "Items";

  return (
    <>
      <div
        className="flex min-w-0 flex-1 items-center gap-3"
        aria-live="polite"
        aria-atomic="true"
      >
        <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-sm font-semibold leading-tight",
              pulse && "animate-count-pop"
            )}
          >
            <AnimatedCounter
              value={summary.totalItems}
              animate
              aria-label={`${summary.totalItems} items in cart`}
            />{" "}
            {itemLabel}
          </p>
          <p className="truncate text-base font-bold leading-tight">
            <AnimatedCounter
              value={displayPrice}
              format={formatINR}
              animate
              aria-label={`Cart total ${formatINR(displayPrice)}`}
            />
          </p>
        </div>
      </div>
      <ViewCartButton />
    </>
  );
});

export function FloatingCartBar() {
  const { visible, phase } = useCartVisibility();
  const updatedAt = useCartStore((s) => s.updatedAt);
  const summary = useCartStore(useShallow(selectCartSummary));
  const [pulse, setPulse] = useState(false);
  const prevUpdatedAt = useRef(updatedAt);

  useEffect(() => {
    if (!updatedAt || updatedAt === prevUpdatedAt.current) return;
    prevUpdatedAt.current = updatedAt;
    setPulse(true);
    const timer = window.setTimeout(() => setPulse(false), 350);
    return () => window.clearTimeout(timer);
  }, [updatedAt]);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Floating cart summary"
      className={cn(
        "pointer-events-none fixed left-1/2 z-50 w-[90%] max-w-[420px] -translate-x-1/2 sm:w-[320px] md:w-[360px] lg:w-[380px]",
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px)+16px)] sm:bottom-6"
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex h-[60px] items-center justify-between gap-3 rounded-full px-[18px] py-3 text-white",
          "border border-white/20 bg-gradient-to-r from-[#FF6B00] to-[#FF8A00]",
          "shadow-[0_12px_40px_-8px_rgba(255,107,0,0.55)] backdrop-blur-md",
          phase === "enter" && "animate-cart-enter",
          phase === "exit" && "animate-cart-exit"
        )}
      >
        <CartSummaryContent summary={summary} pulse={pulse} />
      </div>
    </div>
  );
}
