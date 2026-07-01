import { WifiOff } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function OfflinePage() {
  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <Logo />
      <span className="mt-4 grid h-16 w-16 place-items-center rounded-2xl bg-brand-surface text-brand-primary">
        <WifiOff className="h-8 w-8" />
      </span>
      <h1 className="text-2xl font-bold text-ink">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        It looks like you&apos;ve lost your internet connection. Please check
        your network and try again.
      </p>
    </div>
  );
}
