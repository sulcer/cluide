import type { FileKind, Scope } from "@shared/api";

export type ScreenId =
  | "settings"
  | "memory"
  | "rules"
  | "keybindings"
  | "agents"
  | "skills"
  | "commands"
  | "hooks"
  | "plugins"
  | "mcp";

export interface ScreenDef {
  id: ScreenId;
  label: string;
  group: "Config" | "Extensions" | "MCP";
  kind?: FileKind;
  globalOnly?: boolean;
  primary?: string;
}

export const SCREENS: ScreenDef[] = [
  { id: "settings", label: "Settings", group: "Config" },
  { id: "memory", label: "Memory", group: "Config", kind: "memory" },
  { id: "rules", label: "Rules", group: "Config", kind: "rules", primary: "New rule" },
  { id: "keybindings", label: "Keybindings", group: "Config", kind: "keybindings", globalOnly: true },
  { id: "agents", label: "Agents", group: "Extensions", kind: "agents", primary: "New agent" },
  { id: "skills", label: "Skills", group: "Extensions", kind: "skills", primary: "New skill" },
  { id: "commands", label: "Commands", group: "Extensions", kind: "commands", primary: "New command" },
  { id: "hooks", label: "Hooks", group: "Extensions" },
  { id: "plugins", label: "Plugins", group: "Extensions", globalOnly: true },
  { id: "mcp", label: "MCP servers", group: "MCP", primary: "Add server" },
];

export const HOOK_SCRIPT_PRIMARY = "New script";

export const screenDef = (id: string | undefined): ScreenDef | undefined => SCREENS.find((s) => s.id === id);

export const visibleScreens = (scope: Scope): ScreenDef[] => SCREENS.filter((s) => scope === "global" || !s.globalOnly);

export const scopeUrl = (scope: Scope): string => (scope === "global" ? "/global" : `/p/${encodeURIComponent(scope)}`);

export const screenUrl = (scope: Scope, id: ScreenId): string => `${scopeUrl(scope)}/${id}`;

// react-router decodes every escape, %2F included, before useParams, so the param is already a path.
export const decodeProject = (param: string): string => param;

export const scopeName = (scope: Scope): string =>
  scope === "global" ? "Global" : (scope.split("/").filter(Boolean).at(-1) ?? scope);

export const kindDir = (scope: Scope, kind: FileKind, claudeDir: string | null): string =>
  scope === "global" ? `${claudeDir ?? ""}/${kind}` : `${scope}/.claude/${kind}`;
