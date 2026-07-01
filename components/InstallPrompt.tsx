"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Logo } from "@/components/Logo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (sessionStorage.getItem("vantoo-install-dismissed") !== "1") {
        setVisible(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
  };

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem("vantoo-install-dismissed", "1");
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-[90] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-cardHover sm:bottom-6">
      <Logo iconOnly />
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink">Install Vantoo</p>
        <p className="text-xs text-ink-muted">
          Add to your home screen for a faster, app-like experience.
        </p>
      </div>
      <button
        onClick={install}
        className="inline-flex items-center gap-1 rounded-xl bg-brand-primary px-3 py-2 text-sm font-semibold text-white"
      >
        <Download className="h-4 w-4" />
        Install
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="rounded-lg p-1 text-ink-soft hover:bg-gray-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
