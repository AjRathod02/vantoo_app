"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useToastStore } from "@/lib/stores/toast";

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-brand-accent" />,
  error: <XCircle className="h-5 w-5 text-brand-secondary" />,
  info: <Info className="h-5 w-5 text-brand-primary" />,
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex animate-fade-in items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-cardHover"
        >
          {icons[t.type]}
          <span className="text-sm font-medium text-ink">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
