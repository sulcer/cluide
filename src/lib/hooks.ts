import type { FileEntry } from "@shared/api";

export interface HookRow { event: string; matcher: string; command: string; type: string; file: string }

// One row per hook inside each matcher entry of a settings document's `hooks` key, in file order.
export function flattenHooks(json: Record<string, unknown> | null, file: string): HookRow[] {
  const hooks = json?.hooks;
  if (hooks === null || typeof hooks !== "object") return [];
  const rows: HookRow[] = [];
  for (const [event, entries] of Object.entries(hooks as Record<string, unknown>)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries as Array<Record<string, unknown>>) {
      const matcher = entry.matcher === undefined ? "*" : Array.isArray(entry.matcher) ? entry.matcher.join(", ") : String(entry.matcher);
      const inner = Array.isArray(entry.hooks) ? (entry.hooks as Array<Record<string, unknown>>) : [];
      for (const hook of inner) {
        rows.push({ event, matcher, command: String(hook.command ?? ""), type: String(hook.type ?? "command"), file });
      }
    }
  }
  return rows;
}

// The script in this scope's hooks/ directory that a command runs, by its first token.
export function scriptFor(command: string, scripts: FileEntry[]): FileEntry | undefined {
  const token = command.trim().split(/\s+/)[0] ?? "";
  return scripts.find((s) => token === s.path || token.endsWith(`/hooks/${s.name}`));
}

export const language = (name: string): string =>
  name.endsWith(".py") ? "python" : name.endsWith(".sh") ? "bash" : (name.split(".").at(-1) ?? "");
