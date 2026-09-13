import type { Scope } from "@shared/api";
import { PanelLeft, Plus } from "lucide-react";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { emit } from "@/lib/events";
import { HOOK_SCRIPT_PRIMARY, type ScreenId, screenDef, scopeName } from "@/lib/routes";

interface Props { scope: Scope; screen: ScreenId | undefined; file: string | undefined; onToggleSidebar: () => void }

export function Header({ scope, screen, file, onToggleSidebar }: Props) {
  const def = screenDef(screen);
  const primary = file !== undefined ? HOOK_SCRIPT_PRIMARY : def?.primary;
  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b pr-3 pl-2">
      <IconButton label="Toggle sidebar" onClick={onToggleSidebar}>
        <PanelLeft />
      </IconButton>
      <div className="flex min-w-0 items-center gap-1.5 font-medium">
        <span className="truncate text-muted-foreground">{scopeName(scope)}</span>
        <span className="text-muted-foreground">/</span>
        <span className="truncate">
          {def?.label}
          {file !== undefined && ` / ${file}`}
        </span>
      </div>
      <div className="flex-1" />
      {primary && (
        <Button variant="primary" onClick={() => emit("cluide:primary")}>
          <Plus />
          {primary}
        </Button>
      )}
    </header>
  );
}
