import type { Project, Scope } from "@shared/api";
import { Command as CommandPrimitive } from "cmdk";
import { Folder, FolderX, History, Moon, Plus, Search, Sun } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Kbd } from "@/components/Kbd";
import { Command, CommandEmpty, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScreenIcon } from "@/lib/icons";
import { MOD } from "@/lib/keys";
import { readRecent } from "@/lib/recent";
import { screenUrl, scopeName, visibleScreens } from "@/lib/routes";
import { toggleTheme, useTheme } from "@/lib/theme";
import { contains } from "./ScopeSwitcher";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; scope: Scope; projects: Project[] }

export function CommandMenu({ open, onOpenChange, scope, projects }: Props) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const close = () => {
    setQuery("");
    onOpenChange(false);
  };
  const go = (url: string, state?: unknown) => {
    close();
    navigate(url, { state });
  };
  const shown = query === "" ? projects.slice(0, 5) : projects;
  const recent = readRecent();

  // Matching is case-insensitive on label and hint; a group with no matches disappears.
  const matches = (label: string, hint?: string) => query === "" || contains(label, query, hint ? [hint] : undefined) > 0;
  const screens = visibleScreens(scope);
  const screenCount = screens.filter((def) => matches(def.label, screenUrl(scope, def.id))).length;
  const projectCount = shown.filter((p) => matches(p.name, p.path)).length;
  const recentCount = recent.filter((r) => matches(r.label, r.path)).length;
  const actionCount = [matches("Toggle theme"), matches("Add server")].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { setQuery(""); onOpenChange(o); }}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/40"
        className="top-24 w-[560px] sm:max-w-[560px] max-w-[calc(100%-32px)] translate-y-0 gap-0 rounded-lg border p-0 shadow-float ring-0"
      >
        <DialogTitle className="sr-only">Command menu</DialogTitle>
        <Command filter={contains} className="bg-transparent p-0">
          <div className="flex h-11 items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <CommandPrimitive.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Type a command or search"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <Kbd>Esc</Kbd>
          </div>
          <CommandList className="max-h-[380px] p-1">
            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">No results for “{query}”</CommandEmpty>
            {screenCount > 0 && (
              <Group heading="Go to">
                {screens.map((def, i) => (
                  <Item key={def.id} icon={<ScreenIcon id={def.id} className="size-4" />} label={def.label} hint={screenUrl(scope, def.id)} kbd={i < 9 ? `${MOD}${i + 1}` : undefined} onSelect={() => go(screenUrl(scope, def.id))} />
                ))}
              </Group>
            )}
            {projectCount > 0 && (
              <Group heading="Switch scope">
                {shown.map((p) => (
                  <Item key={p.path} icon={p.exists ? <Folder className="size-4" /> : <FolderX className="size-4" />} label={p.name} hint={p.path} onSelect={() => go(screenUrl(p.path, "settings"))} />
                ))}
              </Group>
            )}
            {recentCount > 0 && (
              <Group heading="Open file">
                {recent.map((r) => (
                  <Item key={r.path} icon={<History className="size-4" />} label={r.label} hint={r.path} onSelect={() => go(r.url, { path: r.path })} />
                ))}
              </Group>
            )}
            {actionCount > 0 && (
              <Group heading="Actions">
                <Item icon={theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />} label="Toggle theme" onSelect={() => { close(); toggleTheme(); }} />
                <Item icon={<Plus className="size-4" />} label="Add server" onSelect={() => go(screenUrl(scope, "mcp"), { primary: true })} />
              </Group>
            )}
          </CommandList>
          <div className="flex h-8 items-center gap-3 border-t px-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Kbd>↑↓</Kbd> move</span>
            <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
            <span className="ml-auto">{scopeName(scope)} scope</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

const Group = ({ heading, children }: { heading: string; children: React.ReactNode }) => (
  <CommandPrimitive.Group
    heading={heading}
    className="overflow-hidden p-1 [&_[cmdk-group-heading]]:flex [&_[cmdk-group-heading]]:h-6 [&_[cmdk-group-heading]]:items-center [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
  >
    {children}
  </CommandPrimitive.Group>
);

function Item(props: { icon: React.ReactNode; label: string; hint?: string; kbd?: string; onSelect: () => void }) {
  return (
    <CommandPrimitive.Item
      value={props.label}
      keywords={props.hint ? [props.hint] : undefined}
      onSelect={props.onSelect}
      className="flex h-8 items-center gap-2.5 rounded-sm px-2 text-[13px] outline-none select-none data-[selected=true]:bg-accent"
    >
      <span className="text-muted-foreground">{props.icon}</span>
      <span>{props.label}</span>
      {props.hint && <span className="truncate font-mono text-[11px] text-muted-foreground">{props.hint}</span>}
      {props.kbd && <Kbd className="ml-auto">{props.kbd}</Kbd>}
    </CommandPrimitive.Item>
  );
}
