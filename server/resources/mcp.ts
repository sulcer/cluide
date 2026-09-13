import { join } from "node:path";
import type { McpConfig, McpEntry, McpScope, Scope, WriteResult } from "@shared/api";
import { ApiError, requireBoolean, requireString } from "../errors";
import { patchJson, readJsonOrEmpty, sliceEtag } from "../fs";
import { assertScope, claudeDir, claudeJsonPath } from "../paths";
import { listPlugins } from "./plugins";

const PRECEDENCE: McpScope[] = ["local", "project", "user", "plugin", "managed"];

interface Source {
  scope: McpScope;
  file: string;
  servers: Record<string, McpConfig>;
  etag: string | null;
}

export function listMcp(scopeArg: string): McpEntry[] {
  const scope = assertScope(scopeArg);
  const claudeJson = readJsonOrEmpty(claudeJsonPath());
  const sources: Source[] = [];
  if (scope !== "global") {
    const local = claudeJson.projects?.[scope]?.mcpServers ?? {};
    sources.push({ scope: "local", file: claudeJsonPath(), servers: local, etag: sliceEtag(local) });
    const mcpJsonPath = join(scope, ".mcp.json");
    const project = readJsonOrEmpty(mcpJsonPath).mcpServers ?? {};
    sources.push({ scope: "project", file: mcpJsonPath, servers: project, etag: sliceEtag(project) });
  }
  const user = claudeJson.mcpServers ?? {};
  sources.push({ scope: "user", file: claudeJsonPath(), servers: user, etag: sliceEtag(user) });
  for (const plugin of listPlugins()) {
    if (!plugin.enabled || !plugin.hasMcp) continue;
    const file = join(plugin.installPath, ".mcp.json");
    const servers = readJsonOrEmpty(file).mcpServers ?? {};
    const prefixed = Object.fromEntries(
      Object.entries(servers).map(([name, config]) => [`plugin_${plugin.name}_${name}`, config as McpConfig]),
    );
    sources.push({ scope: "plugin", file, servers: prefixed, etag: null });
  }
  const settingsPath = join(claudeDir(), "settings.json");
  sources.push({
    scope: "managed",
    file: settingsPath,
    servers: readJsonOrEmpty(settingsPath).managedMcpServers ?? {},
    etag: null,
  });

  const approved = scope === "global" ? (_name: string) => null : approvalOf(scope);
  const entries: McpEntry[] = [];
  for (const source of sources) {
    for (const [name, config] of Object.entries(source.servers)) {
      entries.push({
        name,
        scope: source.scope,
        file: source.file,
        config,
        effective: false,
        shadowedBy: null,
        enabled: source.scope === "project" ? approved(name) : null,
        etag: source.etag,
      });
    }
  }
  const rank = (entry: McpEntry) => PRECEDENCE.indexOf(entry.scope);
  const byName = new Map<string, McpEntry[]>();
  for (const entry of entries) byName.set(entry.name, [...(byName.get(entry.name) ?? []), entry]);
  for (const group of byName.values()) {
    group.sort((a, b) => rank(a) - rank(b));
    group[0].effective = true;
    for (const shadowed of group.slice(1)) shadowed.shadowedBy = group[0].scope;
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name) || rank(a) - rank(b));
}

function approvalOf(project: string): (name: string) => boolean {
  const files = [
    join(claudeDir(), "settings.json"),
    join(claudeDir(), "settings.local.json"),
    join(project, ".claude", "settings.json"),
    join(project, ".claude", "settings.local.json"),
  ];
  let all = false;
  const enabled = new Set<string>();
  const disabled = new Set<string>();
  const leftover = readJsonOrEmpty(claudeJsonPath()).projects?.[project] ?? {};
  for (const json of [...files.map(readJsonOrEmpty), leftover]) {
    if (json.enableAllProjectMcpServers === true) all = true;
    for (const name of json.enabledMcpjsonServers ?? []) enabled.add(name);
    for (const name of json.disabledMcpjsonServers ?? []) disabled.add(name);
  }
  return (name) => all || (enabled.has(name) && !disabled.has(name));
}

interface Target {
  path: string;
  slice: (json: any) => unknown;
  servers: (json: any) => Record<string, McpConfig>;
}

function targetOf(scope: Scope, target: string): Target {
  if (target === "user") {
    return { path: claudeJsonPath(), slice: (j) => j.mcpServers, servers: (j) => (j.mcpServers ??= {}) };
  }
  if (scope === "global") throw new ApiError(400, "bad_request", `target ${target} needs a project scope`);
  if (target === "local") {
    return {
      path: claudeJsonPath(),
      slice: (j) => j.projects?.[scope]?.mcpServers,
      servers: (j) => {
        j.projects ??= {};
        j.projects[scope] ??= {};
        j.projects[scope].mcpServers ??= {};
        return j.projects[scope].mcpServers;
      },
    };
  }
  if (target === "project") {
    return { path: join(scope, ".mcp.json"), slice: (j) => j.mcpServers, servers: (j) => (j.mcpServers ??= {}) };
  }
  throw new ApiError(400, "bad_request", `unknown target: ${target}`);
}

export function putMcp(body: unknown): WriteResult {
  const scope = assertScope(requireString(body, "scope"));
  const target = targetOf(scope, requireString(body, "target"));
  const name = requireString(body, "name");
  const { config, etag } = body as { config: unknown; etag?: string };
  const c = config as Record<string, unknown> | null;
  if (c === null || typeof c !== "object" || (typeof c.command !== "string" && typeof c.url !== "string")) {
    throw new ApiError(400, "bad_request", "config needs a command or a url");
  }
  return patchJson(
    target.path,
    target.slice,
    (json) => {
      target.servers(json)[name] = c as McpConfig;
    },
    etag,
  );
}

export function deleteMcp(scopeArg: string, targetArg: string, name: string, etag?: string): void {
  const target = targetOf(assertScope(scopeArg), targetArg);
  patchJson(
    target.path,
    target.slice,
    (json) => {
      const servers = target.servers(json);
      if (!(name in servers)) throw new ApiError(404, "not_found", `no ${targetArg} server named ${name}`);
      delete servers[name];
    },
    etag,
  );
}

export function setMcpApproval(body: unknown): WriteResult {
  const scope = assertScope(requireString(body, "scope"));
  if (scope === "global") throw new ApiError(400, "bad_request", "approval applies to a project scope");
  const name = requireString(body, "name");
  const enabled = requireBoolean(body, "enabled");
  const defined = readJsonOrEmpty(join(scope, ".mcp.json")).mcpServers ?? {};
  if (!(name in defined)) throw new ApiError(404, "not_found", `.mcp.json defines no server named ${name}`);
  const without = (list?: string[]) => (list ?? []).filter((n) => n !== name);
  return patchJson(
    join(scope, ".claude", "settings.local.json"),
    (j) => ({ enabled: j.enabledMcpjsonServers ?? [], disabled: j.disabledMcpjsonServers ?? [] }),
    (j) => {
      j.enabledMcpjsonServers = without(j.enabledMcpjsonServers);
      j.disabledMcpjsonServers = without(j.disabledMcpjsonServers);
      (enabled ? j.enabledMcpjsonServers : j.disabledMcpjsonServers).push(name);
    },
  );
}
