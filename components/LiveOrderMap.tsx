"use client";

import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  showRoute?: boolean;
  riderLat?: number;
  riderLng?: number;
  destinationLat?: number;
  destinationLng?: number;
};

export function LiveOrderMap({
  className,
  showRoute = false,
  riderLat = 12.9716,
  riderLng = 77.5946,
  destinationLat = 12.9916,
  destinationLng = 77.6146,
}: Props) {
  const riderX = 20 + ((riderLng - 77.58) / 0.05) * 60;
  const riderY = 70 - ((riderLat - 12.96) / 0.05) * 60;
  const destX = 20 + ((destinationLng - 77.58) / 0.05) * 60;
  const destY = 70 - ((destinationLat - 12.96) / 0.05) * 60;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-gray-200 bg-[#e8f4ea]",
        className
      )}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(#c5d9c8 1px, transparent 1px), linear-gradient(90deg, #c5d9c8 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {showRoute && (
          <>
            <line
              x1={riderX}
              y1={riderY}
              x2={destX}
              y2={destY}
              stroke="#FF6B00"
              strokeWidth="0.8"
              strokeDasharray="2 1.5"
            />
            <circle cx={destX} cy={destY} r="2.5" fill="#E63946" />
          </>
        )}
        <circle cx={riderX} cy={riderY} r="3" fill="#FF6B00" className="animate-pulse" />
      </svg>

      <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-ink shadow-sm">
        {showRoute ? "Live rider location" : "Delivery area"}
      </div>

      {showRoute && (
        <div className="absolute right-3 top-3 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
          LIVE
        </div>
      )}
    </div>
  );
}
