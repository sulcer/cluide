import type { Project, Scope } from "@shared/api";
import { cn } from "cn";
import { Command, Moon, Sun } from "lucide-react";
import { NavLink } from "react-router";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Kbd } from "@/components/Kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/useTheme";
import { ScreenIcon } from "@/lib/icons";
import { MOD } from "@/lib/keys";
import { type ScreenDef, type ScreenId, screenUrl, visibleScreens } from "@/lib/routes";
import { toggleTheme } from "@/lib/theme";
import { ScopeSwitcher } from "./ScopeSwitcher";

const GROUPS = ["Config", "Extensions", "MCP"] as const;

interface Props {
  rail: boolean;
  scope: Scope;
  screen: ScreenId | undefined;
  projects: Project[] | undefined;
  onOpenMenu: () => void;
}

export function Sidebar({ rail, scope, screen, projects, onOpenMenu }: Props) {
  const items = visibleScreens(scope);
  const theme = useTheme();
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const hint = (def: ScreenDef) => {
    const n = items.indexOf(def) + 1;
    return n <= 9 ? `${MOD}${n}` : null;
  };

  if (rail) {
    return (
      <aside className="flex w-12 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-2 text-sidebar-foreground">
        <ScopeSwitcher scope={scope} screen={screen} projects={projects} rail />
        <div className="my-2 h-px w-6 bg-sidebar-border" />
        {items.map((def) => (
          <Tooltip key={def.id}>
            <TooltipTrigger asChild>
              <NavLink
                to={screenUrl(scope, def.id)}
                aria-label={def.label}
                className={cn(
                  "flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent",
                  def.id === screen && "bg-sidebar-accent text-sidebar-foreground",
                )}
              >
                <ScreenIcon id={def.id} className="size-4" />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              {def.label}
              {hint(def) && <Kbd>{hint(def)}</Kbd>}
            </TooltipContent>
          </Tooltip>
        ))}
        <div className="flex-1" />
        <Tooltip>
          <TooltipTrigger asChild>
            <IconButton label="Toggle theme" className="size-8 rounded-md" onClick={toggleTheme}>
              <ThemeIcon />
            </IconButton>
          </TooltipTrigger>
          <TooltipContent side="right">Toggle theme</TooltipContent>
        </Tooltip>
      </aside>
    );
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-2 pt-2 pb-1">
        <ScopeSwitcher scope={scope} screen={screen} projects={projects} />
      </div>
      <nav className="flex flex-1 flex-col gap-3 px-2 py-1">
        {GROUPS.map((group) => (
          <div key={group}>
            <div className="flex h-6 items-center text-xs font-medium text-muted-foreground">{group}</div>
            {items
              .filter((def) => def.group === group)
              .map((def) => (
                <NavLink
                  key={def.id}
                  to={screenUrl(scope, def.id)}
                  className={({ isActive }) =>
                    cn(
                      "flex h-7 items-center gap-2 rounded-sm px-2 font-medium text-muted-foreground hover:bg-sidebar-accent",
                      isActive && "selected bg-sidebar-accent text-sidebar-foreground",
                    )
                  }
                >
                  <ScreenIcon id={def.id} className="size-4" />
                  <span className="flex-1 truncate">{def.label}</span>
                  {hint(def) && (
                    <span className="font-mono text-[11px] text-muted-foreground opacity-70">{hint(def)}</span>
                  )}
                </NavLink>
              ))}
          </div>
        ))}
      </nav>
      <div className="flex h-10 shrink-0 items-center gap-1 border-t border-sidebar-border px-3">
        <IconButton label="Toggle theme" onClick={toggleTheme}>
          <ThemeIcon />
        </IconButton>
        <span className="font-mono text-[11px] text-muted-foreground">v{__CLUIDE_VERSION__}</span>
        <div className="flex-1" />
        <Button size="xs" onClick={onOpenMenu} aria-label="Open the command menu">
          <Command className="size-3.5" />K
        </Button>
      </div>
    </aside>
  );
}
