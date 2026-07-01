import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A lightweight stand-in for a real map (Google Maps / Mapbox are out of scope
 * for this demo). Renders a stylised grid with a pin and, optionally, an
 * animated delivery route.
 */
export function MockMap({
  className,
  showRoute = false,
}: {
  className?: string;
  showRoute?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gray-100 bg-[#eef3f0]",
        className
      )}
    >
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(#d7e2dc 1px, transparent 1px), linear-gradient(90deg, #d7e2dc 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute left-1/4 top-0 h-full w-6 bg-white/70" />
      <div className="absolute left-0 top-1/2 h-5 w-full bg-white/70" />

      {showRoute ? (
        <>
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            <path
              d="M 15% 80% C 35% 60%, 45% 55%, 60% 40% S 80% 20%, 85% 18%"
              fill="none"
              stroke="#FF6B00"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="500"
              strokeDashoffset="500"
              style={{ animation: "dash 3s ease-out forwards" }}
            />
          </svg>
          <span className="absolute left-[13%] top-[78%] grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white shadow-cardHover">
            <MapPin className="h-4 w-4 text-brand-secondary" />
          </span>
          <span className="absolute left-[85%] top-[16%] grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-primary text-white shadow-cardHover">
            <Navigation className="h-4 w-4" />
          </span>
        </>
      ) : (
        <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-primary text-white shadow-cardHover">
          <MapPin className="h-5 w-5" />
        </span>
      )}
    </div>
  );
}
