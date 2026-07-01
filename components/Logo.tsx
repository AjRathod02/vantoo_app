import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-label="Vantoo home"
    >
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-brand-primary font-extrabold text-white">
        V
        <span className="absolute -left-1 top-1.5 h-0.5 w-1.5 rounded-full bg-brand-primary/60" />
        <span className="absolute -left-1.5 top-3.5 h-0.5 w-2.5 rounded-full bg-brand-primary/40" />
      </span>
      {!iconOnly && (
        <span className="text-xl font-extrabold tracking-tight text-brand-primary">
          Vantoo
        </span>
      )}
    </Link>
  );
}
