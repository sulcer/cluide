import type { FileEntry, Project } from "@shared/api";
import { useCallback, useRef, useState } from "react";
import { Outlet } from "react-router";
import { Toaster } from "@/components/Toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useResource } from "@/hooks/useResource";
import { useRoute } from "@/hooks/useRoute";
import { useShortcuts } from "@/hooks/useShortcuts";
import { useWindowEvent } from "@/hooks/useWindowEvent";
import { readStorage, writeStorage } from "@/lib/storage";
import { CommandMenu } from "./CommandMenu";
import { Header } from "./Header";
import { OfflineBanner } from "./OfflineBanner";
import { Sidebar } from "./Sidebar";

export interface ShellContext { claudeDir: string | null }

export function Shell() {
  const { scope, screen, file } = useRoute();
  const projects = useResource<Project[]>("/api/projects");
  const memory = useResource<FileEntry[]>("/api/files?scope=global&kind=memory");
  const claudeDir = memory.data?.[0] ? memory.data[0].path.slice(0, -"/CLAUDE.md".length) : null;
  const [rail, setRail] = useState(() => readStorage<"full" | "rail">("cluide.sidebar", "full") === "rail");
  const [menuOpen, setMenuOpen] = useState(false);
  const [offline, setOffline] = useState(false);
  const frame = useRef<HTMLDivElement>(null);

  useWindowEvent("cluide:offline", () => setOffline(true));
  useWindowEvent("cluide:online", () => setOffline(false));
  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);
  useShortcuts(scope, toggleMenu);

  const toggleRail = () => {
    setRail((r) => {
      writeStorage("cluide.sidebar", r ? "full" : "rail");
      return !r;
    });
  };

  // tabIndex -1 makes the frame take focus on a click on blank space, so j/k and Esc work without a focused control.
  return (
    <TooltipProvider>
      <div ref={frame} tabIndex={-1} className="flex h-full outline-none">
        <Sidebar rail={rail} scope={scope} screen={screen} projects={projects.data} onOpenMenu={toggleMenu} />
        <div className="flex min-w-0 flex-1 flex-col">
          {offline && <OfflineBanner />}
          <Header scope={scope} screen={screen} file={file} onToggleSidebar={toggleRail} />
          <main className="flex min-h-0 flex-1 flex-col">
            <Outlet context={{ claudeDir } satisfies ShellContext} />
          </main>
        </div>
        <CommandMenu open={menuOpen} onOpenChange={setMenuOpen} scope={scope} projects={projects.data ?? []} />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
