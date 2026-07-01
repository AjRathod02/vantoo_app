import { cn } from "@/lib/utils";

type Tone = "orange" | "red" | "green" | "gray";

const tones: Record<Tone, string> = {
  orange: "bg-brand-primary/10 text-brand-primary",
  red: "bg-brand-secondary/10 text-brand-secondary",
  green: "bg-brand-accent/15 text-green-700",
  gray: "bg-gray-100 text-ink-muted",
};

export function Badge({
  children,
  tone = "orange",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
