import { existsSync } from "node:fs";
import { join } from "node:path";
import type { McpSourceError, Plugin, WriteResult } from "@shared/api";
import { ApiError, requireBoolean, requireString } from "../errors";
import { patchJson, readJsonOrEmpty, readSource, sliceEtag } from "../fs";
import { claudeDir } from "../paths";

interface Install {
  installPath: string;
  version: string;
  lastUpdated: string;
}

const registryPath = (): string => join(claudeDir(), "plugins", "installed_plugins.json");
const marketplacesPath = (): string => join(claudeDir(), "plugins", "known_marketplaces.json");
const settingsPath = (): string => join(claudeDir(), "settings.json");

// With errors given, a file that does not parse contributes nothing and is reported instead of
// thrown; without it (the default, used by the plugins resource itself), a broken file is a 422.
export function listPlugins(errors?: McpSourceError[]): Plugin[] {
  const read = errors ? (path: string) => readSource(path, errors) : readJsonOrEmpty;
  const registry: Record<string, Install[]> = read(registryPath()).plugins ?? {};
  const marketplaces = read(marketplacesPath());
  const enabled: Record<string, boolean> = read(settingsPath()).enabledPlugins ?? {};
  const etag = sliceEtag(enabled);
  return Object.entries(registry)
    .map(([id, installs]) => {
      const latest = [...installs].sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))[0];
      const at = id.lastIndexOf("@");
      const name = id.slice(0, at);
      const marketplace = id.slice(at + 1);
      return {
        id,
        name,
        marketplace,
        marketplaceSource: marketplaces[marketplace]?.source?.repo ?? null,
        version: latest.version,
        installPath: latest.installPath,
        enabled: enabled[id] === true,
        hasMcp: existsSync(join(latest.installPath, ".mcp.json")),
        hasHooks: existsSync(join(latest.installPath, "hooks", "hooks.json")),
        etag,
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function setPluginEnabled(body: unknown): WriteResult {
  const id = requireString(body, "id");
  const enabled = requireBoolean(body, "enabled");
  const etag = (body as { etag?: string }).etag;
  const registry: Record<string, Install[]> = readJsonOrEmpty(registryPath()).plugins ?? {};
  if (!(id in registry)) throw new ApiError(404, "not_found", `plugin ${id} is not installed`);
  return patchJson(
    settingsPath(),
    (json) => json.enabledPlugins,
    (json) => {
      json.enabledPlugins ??= {};
      json.enabledPlugins[id] = enabled;
    },
    etag,
  );
}
