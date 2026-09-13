import type { McpScope } from "@shared/api";
import { cn } from "cn";
import type { ReactNode } from "react";

const base = "inline-flex h-[18px] shrink-0 items-center rounded-sm px-1.5 text-[11px] font-medium leading-none";

const scopeClass: Record<McpScope, string> = {
  local: "bg-foreground text-background",
  project: "border border-foreground",
  user: "border bg-secondary",
  plugin: "border border-dashed border-muted-foreground text-muted-foreground",
  managed: "border bg-muted text-muted-foreground",
};

export const ScopeBadge = ({ scope }: { scope: McpScope }) => (
  <span className={cn(base, "font-mono", scopeClass[scope])}>{scope}</span>
);

export const ProvidesBadge = ({ children }: { children: ReactNode }) => (
  <span className={cn(base, "border bg-secondary")}>{children}</span>
);

export const CountBadge = ({ count }: { count: number }) => (
  <span
    className={cn(
      "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-medium",
      count > 0 ? "bg-warning text-black" : "bg-muted text-muted-foreground",
    )}
  >
    {count}
  </span>
);

export const DashedBadge = ({ children, title }: { children: ReactNode; title?: string }) => (
  <span
    title={title}
    className={cn(base, "gap-1 border border-dashed font-normal text-muted-foreground [&_svg]:size-3")}
  >
    {children}
  </span>
);
