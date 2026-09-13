import type { Project, Scope } from "@shared/api";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "cn";
import { Check, ChevronsUpDown, Folder, FolderX, Globe, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { IconButton } from "@/components/IconButton";
import { Kbd } from "@/components/Kbd";
import { Command, CommandEmpty, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type ScreenId, scopeName, screenDef, screenUrl } from "@/lib/routes";

export const contains = (value: string, search: string, keywords?: string[]): number =>
  [value, ...(keywords ?? [])].some((s) => s.toLowerCase().includes(search.toLowerCase())) ? 1 : 0;

interface Props {
  scope: Scope;
  screen: ScreenId | undefined;
  projects: Project[] | undefined;
  rail?: boolean;
}

export function ScopeSwitcher({ scope, screen, projects, rail }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const current = projects?.find((p) => p.path === scope);
  const Icon = scope === "global" ? Globe : current?.exists === false ? FolderX : Folder;

  const pick = (target: Scope) => {
    setOpen(false);
    const def = screenDef(screen);
    const next = def === undefined || (target !== "global" && def.globalOnly) ? "settings" : def.id;
    navigate(screenUrl(target, next));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {rail ? (
          <IconButton label="Switch scope" className="size-8 rounded-md">
            <Icon />
          </IconButton>
        ) : (
          <button
            type="button"
            className="flex h-8 w-full items-center gap-2 rounded-md px-2 font-medium hover:bg-sidebar-accent"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-left">{scopeName(scope)}</span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={2}
        className="w-[300px] rounded-lg border bg-popover p-0 shadow-float ring-0"
      >
        <Command filter={contains} className="bg-transparent p-0">
          <div className="flex h-9 items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <CommandPrimitive.Input
              autoFocus
              placeholder="Switch scope"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            />
            <Kbd>Esc</Kbd>
          </div>
          <CommandList className="max-h-[328px] p-1">
            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">No project matches</CommandEmpty>
            <ScopeItem
              icon={Globe}
              name="Global"
              path=""
              selected={scope === "global"}
              onSelect={() => pick("global")}
            />
            {projects?.map((p) => (
              <ScopeItem
                key={p.path}
                icon={p.exists ? Folder : FolderX}
                name={p.name}
                path={p.path}
                selected={p.path === scope}
                missing={!p.exists}
                onSelect={() => pick(p.path)}
              />
            ))}
          </CommandList>
          <div className="flex h-8 items-center justify-between border-t px-3 text-[11px] text-muted-foreground">
            <span>{projects?.length ?? 0} projects</span>
            <span className="flex items-center gap-1.5">
              <Kbd>↑↓</Kbd> move <Kbd>↵</Kbd> switch
            </span>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ScopeItem(props: {
  icon: typeof Folder;
  name: string;
  path: string;
  selected: boolean;
  missing?: boolean;
  onSelect: () => void;
}) {
  return (
    <CommandPrimitive.Item
      value={props.path === "" ? "Global" : props.name}
      keywords={[props.path]}
      onSelect={props.onSelect}
      className={cn(
        "flex min-h-9 items-start gap-2 rounded-sm px-2 py-1 outline-none select-none",
        props.selected && "bg-accent",
        props.missing && "opacity-50",
      )}
    >
      <props.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{props.name}</span>
        {props.path && <span className="block truncate font-mono text-[11px] text-muted-foreground">{props.path}</span>}
      </span>
      {props.selected && <Check className="mt-0.5 size-4 shrink-0" />}
      {props.missing && <span className="text-[11px] text-muted-foreground">missing</span>}
    </CommandPrimitive.Item>
  );
}
