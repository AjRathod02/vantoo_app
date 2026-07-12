"use client";

import { cn } from "@/lib/utils";

type Tone = "green" | "orange" | "red" | "gray" | "blue";

const TONES: Record<Tone, string> = {
  green: "bg-green-50 text-green-700 ring-green-600/20",
  orange: "bg-orange-50 text-orange-700 ring-orange-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  gray: "bg-gray-100 text-ink-muted ring-gray-500/10",
  blue: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

const STATUS_TONE: Record<string, Tone> = {
  active: "green",
  approved: "green",
  published: "green",
  online: "green",
  delivered: "green",
  paid: "green",
  resolved: "green",
  verified: "green",
  pending: "orange",
  under_review: "orange",
  preparing: "orange",
  packed: "orange",
  assigned: "orange",
  in_transit: "blue",
  picked: "blue",
  processing: "blue",
  suspended: "orange",
  offline: "gray",
  inactive: "gray",
  hidden: "gray",
  closed: "gray",
  blocked: "red",
  rejected: "red",
  cancelled: "red",
  deleted: "red",
  failed: "red",
  critical: "red",
};

export function AdminStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  const tone = STATUS_TONE[key] ?? "gray";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset",
        TONES[tone],
        className
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
