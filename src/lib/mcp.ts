import type { McpConfig, McpEntry } from "@shared/api";

export type Transport = "stdio" | "http" | "sse";

export const transportOf = (config: McpConfig): Transport =>
  config.type === "http" || config.type === "sse" ? config.type : "stdio";

export const commandText = (config: McpConfig): string =>
  // TS can't narrow the positive branch of "in" away from the other variant's index
  // signature, so config.args reads as unknown there; cast to spread it safely.
  "command" in config ? [config.command, ...((config.args as string[] | undefined) ?? [])].join(" ") : config.url;

export const readOnly = (e: McpEntry): boolean => e.scope === "plugin" || e.scope === "managed";

export interface AddForm { transport: Transport; command: string; args: string; url: string; headers: string }

const lines = (s: string): string[] => s.split("\n").map((l) => l.trim()).filter((l) => l !== "");

// The config the add dialog writes; empty parts are omitted.
export function buildConfig(form: AddForm): McpConfig {
  if (form.transport === "stdio") {
    const args = lines(form.args);
    return { command: form.command.trim(), ...(args.length > 0 ? { args } : {}) };
  }
  const headers = Object.fromEntries(
    lines(form.headers)
      .map((l) => {
        const i = l.indexOf(":");
        return i < 0 ? [l, ""] : [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
      .filter(([k]) => k !== ""),
  );
  return { type: form.transport, url: form.url.trim(), ...(Object.keys(headers).length > 0 ? { headers } : {}) };
}
