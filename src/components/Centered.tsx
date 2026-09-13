import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props { icon?: LucideIcon; title: string; path?: string; children?: ReactNode }

export function Centered({ icon: Icon, title, path, children }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
      {Icon && <Icon className="size-5 text-muted-foreground" />}
      <div className="font-medium">{title}</div>
      {path && <div className="max-w-full truncate font-mono text-xs text-muted-foreground">{path}</div>}
      {children && <div className="mt-2 flex items-center gap-2">{children}</div>}
    </div>
  );
}
