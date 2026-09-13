import { cn } from "cn";
import type { ReactNode } from "react";

export function Kbd({
  children,
  onPrimary,
  className,
}: {
  children: ReactNode;
  onPrimary?: boolean;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-4 items-center rounded-sm px-1 font-mono text-[11px] leading-4",
        onPrimary ? "bg-white/16 text-primary-foreground" : "border bg-muted text-muted-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
