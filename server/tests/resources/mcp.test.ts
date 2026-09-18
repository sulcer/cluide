import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ErrorCode, McpEntry } from "@shared/api";
import { ApiError } from "../../errors";
import { sliceEtag } from "../../fs";
import { deleteMcp, listMcp, putMcp, setMcpApproval } from "../../resources/mcp";
import { type TempHome, tempHome } from "../temp-home";

let t: TempHome;
const userServers = { shared: { command: "user-shared" }, github: { type: "http", url: "https://api" } };
const localServers = { shared: { command: "local-shared" } };
const projectServers = { db: { command: "psql" }, shared: { command: "project-shared" } };

beforeEach(() => {
  t = tempHome();
  t.write(
    ".claude.json",
    JSON.stringify({
      mcpServers: userServers,
      projects: { [t.project]: { mcpServers: localServers } },
    }),
  );
  t.write("repo/.mcp.json", JSON.stringify({ mcpServers: projectServers }));
  t.write("repo/.claude/settings.local.json", JSON.stringify({ enabledMcpjsonServers: ["db"] }));
  t.write(
    ".claude/settings.json",
    JSON.stringify({
      managedMcpServers: { corp: { type: "http", url: "https://corp" } },
      enabledPlugins: { "tool@shop": true },
    }),
  );
  t.write(
    ".claude/plugins/installed_plugins.json",
    JSON.stringify({
      version: 2,
      plugins: {
        "tool@shop": [
          {
            scope: "user",
            installPath: join(t.claude, "plugins", "cache", "shop", "tool", "1"),
            version: "1",
            installedAt: "2026-01-01T00:00:00Z",
            lastUpdated: "2026-01-01T00:00:00Z",
          },
        ],
      },
    }),
  );
  t.write(".claude/plugins/known_marketplaces.json", "{}");
  t.write(".claude/plugins/cache/shop/tool/1/.mcp.json", JSON.stringify({ mcpServers: { es: { command: "es" } } }));
});
afterEach(() => t.cleanup());

const rejects = (fn: () => unknown, status: number, code: ErrorCode) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    expect({ status: (e as ApiError).status, code: (e as ApiError).code }).toEqual({ status, code });
    return;
  }
  throw new Error("expected a throw");
};

describe("listMcp", () => {
  test("project scope merges all five sources, marks the winner, reports shadowing and approval", () => {
    const claudeJson = join(t.home, ".claude.json");
    const mcpJson = join(t.project, ".mcp.json");
    const pluginFile = join(t.claude, "plugins", "cache", "shop", "tool", "1", ".mcp.json");
    const settings = join(t.claude, "settings.json");
    const expected: McpEntry[] = [
      {
        name: "db",
        scope: "project",
        file: mcpJson,
        config: { command: "psql" },
        effective: true,
        shadowedBy: null,
        enabled: true,
        etag: sliceEtag(projectServers),
      },
      {
        name: "github",
        scope: "user",
        file: claudeJson,
        config: { type: "http", url: "https://api" },
        effective: true,
        shadowedBy: null,
        enabled: null,
        etag: sliceEtag(userServers),
      },
      {
        name: "plugin_tool_es",
        scope: "plugin",
        file: pluginFile,
        config: { command: "es" },
        effective: true,
        shadowedBy: null,
        enabled: null,
        etag: null,
      },
      {
        name: "shared",
        scope: "local",
        file: claudeJson,
        config: { command: "local-shared" },
        effective: true,
        shadowedBy: null,
        enabled: null,
        etag: sliceEtag(localServers),
      },
      {
        name: "shared",
        scope: "project",
        file: mcpJson,
        config: { command: "project-shared" },
        effective: false,
        shadowedBy: "local",
        enabled: false,
        etag: sliceEtag(projectServers),
      },
      {
        name: "shared",
        scope: "user",
        file: claudeJson,
        config: { command: "user-shared" },
        effective: false,
        shadowedBy: "local",
        enabled: null,
        etag: sliceEtag(userServers),
      },
      {
        name: "corp",
        scope: "managed",
        file: settings,
        config: { type: "http", url: "https://corp" },
        effective: true,
        shadowedBy: null,
        enabled: null,
        etag: null,
      },
    ];
    expect(listMcp(t.project)).toEqual({
      entries: expected.sort((a, b) => a.name.localeCompare(b.name)),
      errors: [],
    });
  });
  test("global scope sees only user, plugin and managed", () => {
    expect(listMcp("global").entries.map((e) => `${e.scope}:${e.name}`)).toEqual([
      "managed:corp",
      "user:github",
      "plugin:plugin_tool_es",
      "user:shared",
    ]);
  });
  test("enableAllProjectMcpServers approves every project server", () => {
    t.write("repo/.claude/settings.json", JSON.stringify({ enableAllProjectMcpServers: true }));
    expect(
      listMcp(t.project)
        .entries.filter((e) => e.scope === "project")
        .map((e) => e.enabled),
    ).toEqual([true, true]);
  });
  test("a disabled plugin contributes no servers", () => {
    t.write(".claude/settings.json", JSON.stringify({ enabledPlugins: {} }));
    expect(listMcp("global").entries.some((e) => e.scope === "plugin")).toBe(false);
  });
  test("a plugin .mcp.json that does not parse is listed as an error, the rest still comes back", () => {
    const claudeJson = join(t.home, ".claude.json");
    const mcpJson = join(t.project, ".mcp.json");
    const pluginMcpJson = join(t.claude, "plugins", "cache", "shop", "tool", "1", ".mcp.json");
    const settings = join(t.claude, "settings.json");
    const scope = t.project;
    const entriesWithoutThePlugin: McpEntry[] = [
      {
        name: "corp",
        scope: "managed",
        file: settings,
        config: { type: "http", url: "https://corp" },
        effective: true,
        shadowedBy: null,
        enabled: null,
        etag: null,
      },
      {
        name: "db",
        scope: "project",
        file: mcpJson,
        config: { command: "psql" },
        effective: true,
        shadowedBy: null,
        enabled: true,
        etag: sliceEtag(projectServers),
      },
      {
        name: "github",
        scope: "user",
        file: claudeJson,
        config: { type: "http", url: "https://api" },
        effective: true,
        shadowedBy: null,
        enabled: null,
        etag: sliceEtag(userServers),
      },
      {
        name: "shared",
        scope: "local",
        file: claudeJson,
        config: { command: "local-shared" },
        effective: true,
        shadowedBy: null,
        enabled: null,
        etag: sliceEtag(localServers),
      },
      {
        name: "shared",
        scope: "project",
        file: mcpJson,
        config: { command: "project-shared" },
        effective: false,
        shadowedBy: "local",
        enabled: false,
        etag: sliceEtag(projectServers),
      },
      {
        name: "shared",
        scope: "user",
        file: claudeJson,
        config: { command: "user-shared" },
        effective: false,
        shadowedBy: "local",
        enabled: null,
        etag: sliceEtag(userServers),
      },
    ];
    // Seed exactly as the plugin-prefix case does, then break the plugin file.
    writeFileSync(pluginMcpJson, "{broken");
    expect(listMcp(scope)).toEqual({
      entries: entriesWithoutThePlugin,
      errors: [{ file: pluginMcpJson, message: ".mcp.json is not valid JSON" }],
    });
  });
  test("a project settings.local.json that does not parse contributes no approvals, the rest still comes back", () => {
    const claudeJson = join(t.home, ".claude.json");
    const mcpJson = join(t.project, ".mcp.json");
    const pluginFile = join(t.claude, "plugins", "cache", "shop", "tool", "1", ".mcp.json");
    const settings = join(t.claude, "settings.json");
    const settingsLocal = join(t.project, ".claude", "settings.local.json");
    const expected: McpEntry[] = [
      {
        name: "corp",
        scope: "managed",
        file: settings,
        config: { type: "http", url: "https://corp" },
        effective: true,
        shadowedBy: null,
        enabled: null,
        etag: null,
      },
      {
        name: "db",
        scope: "project",
        file: mcpJson,
        config: { command: "psql" },
        effective: true,
        shadowedBy: null,
        enabled: false,
        etag: sliceEtag(projectServers),
      },
      {
        name: "github",
        scope: "user",
        file: claudeJson,
        config: { type: "http", url: "https://api" },
        effective: true,
        shadowedBy: null,
        enabled: null,
        etag: sliceEtag(userServers),
      },
      {
        name: "plugin_tool_es",
        scope: "plugin",
        file: pluginFile,
        config: { command: "es" },
        effective: true,
        shadowedBy: null,
        enabled: null,
        etag: null,
      },
      {
        name: "shared",
        scope: "local",
        file: claudeJson,
        config: { command: "local-shared" },
        effective: true,
        shadowedBy: null,
        enabled: null,
        etag: sliceEtag(localServers),
      },
      {
        name: "shared",
        scope: "project",
        file: mcpJson,
        config: { command: "project-shared" },
        effective: false,
        shadowedBy: "local",
        enabled: false,
        etag: sliceEtag(projectServers),
      },
      {
        name: "shared",
        scope: "user",
        file: claudeJson,
        config: { command: "user-shared" },
        effective: false,
        shadowedBy: "local",
        enabled: null,
        etag: sliceEtag(userServers),
      },
    ];
    // db was only approved via this file; breaking it drops that approval instead of failing the list.
    writeFileSync(settingsLocal, "{broken");
    expect(listMcp(t.project)).toEqual({
      entries: expected,
      errors: [{ file: settingsLocal, message: "settings.local.json is not valid JSON" }],
    });
  });
  test("a global settings.json that does not parse is one error, not two, and drops managed and plugins", () => {
    const claudeJson = join(t.home, ".claude.json");
    const settings = join(t.claude, "settings.json");
    // Read by listPlugins (enabledPlugins), the managed source, and would be by approvalOf too,
    // were it called in global scope: proves the dedupe collapses every one of those to one error.
    writeFileSync(settings, "{broken");
    expect(listMcp("global")).toEqual({
      entries: [
        {
          name: "github",
          scope: "user",
          file: claudeJson,
          config: { type: "http", url: "https://api" },
          effective: true,
          shadowedBy: null,
          enabled: null,
          etag: sliceEtag(userServers),
        },
        {
          name: "shared",
          scope: "user",
          file: claudeJson,
          config: { command: "user-shared" },
          effective: true,
          shadowedBy: null,
          enabled: null,
          etag: sliceEtag(userServers),
        },
      ],
      errors: [{ file: settings, message: "settings.json is not valid JSON" }],
    });
  });
  test("a broken installed_plugins.json returns the non-plugin sources with that file in errors", () => {
    const claudeJson = join(t.home, ".claude.json");
    const settings = join(t.claude, "settings.json");
    const registry = join(t.claude, "plugins", "installed_plugins.json");
    writeFileSync(registry, "{broken");
    expect(listMcp("global")).toEqual({
      entries: [
        {
          name: "corp",
          scope: "managed",
          file: settings,
          config: { type: "http", url: "https://corp" },
          effective: true,
          shadowedBy: null,
          enabled: null,
          etag: null,
        },
        {
          name: "github",
          scope: "user",
          file: claudeJson,
          config: { type: "http", url: "https://api" },
          effective: true,
          shadowedBy: null,
          enabled: null,
          etag: sliceEtag(userServers),
        },
        {
          name: "shared",
          scope: "user",
          file: claudeJson,
          config: { command: "user-shared" },
          effective: true,
          shadowedBy: null,
          enabled: null,
          etag: sliceEtag(userServers),
        },
      ],
      errors: [{ file: registry, message: "installed_plugins.json is not valid JSON" }],
    });
  });
});

describe("putMcp", () => {
  test("adds a user server in ~/.claude.json and preserves the rest", () => {
    const result = putMcp({
      scope: "global",
      target: "user",
      name: "new",
      config: { command: "n" },
      etag: sliceEtag(userServers),
    });
    expect(result.etag).toBe(sliceEtag({ ...userServers, new: { command: "n" } }));
    expect(JSON.parse(readFileSync(join(t.home, ".claude.json"), "utf8")).projects).toEqual({
      [t.project]: { mcpServers: localServers },
    });
  });
  test("replaces a project server in .mcp.json", () => {
    putMcp({ scope: t.project, target: "project", name: "db", config: { command: "pg" } });
    expect(JSON.parse(readFileSync(join(t.project, ".mcp.json"), "utf8"))).toEqual({
      mcpServers: { db: { command: "pg" }, shared: { command: "project-shared" } },
    });
  });
  test("rejects a config without command or url", () => {
    rejects(() => putMcp({ scope: "global", target: "user", name: "x", config: { args: [] } }), 400, "bad_request");
  });
  test("rejects a local target in global scope", () => {
    rejects(
      () => putMcp({ scope: "global", target: "local", name: "x", config: { command: "x" } }),
      400,
      "bad_request",
    );
  });
});

describe("deleteMcp", () => {
  test("removes a local server", () => {
    deleteMcp(t.project, "local", "shared", sliceEtag(localServers));
    expect(JSON.parse(readFileSync(join(t.home, ".claude.json"), "utf8")).projects[t.project]).toEqual({
      mcpServers: {},
    });
  });
  test("404 for a name that is not in the target", () => {
    rejects(() => deleteMcp("global", "user", "nope"), 404, "not_found");
  });
});

describe("setMcpApproval", () => {
  test("moves a name between the enabled and disabled lists in settings.local.json", () => {
    setMcpApproval({ scope: t.project, name: "db", enabled: false });
    setMcpApproval({ scope: t.project, name: "shared", enabled: true });
    expect(JSON.parse(readFileSync(join(t.project, ".claude", "settings.local.json"), "utf8"))).toEqual({
      enabledMcpjsonServers: ["shared"],
      disabledMcpjsonServers: ["db"],
    });
  });
  test("404 for a server that .mcp.json does not define", () => {
    rejects(() => setMcpApproval({ scope: t.project, name: "ghost", enabled: true }), 404, "not_found");
  });
  test("rejects global scope", () => {
    rejects(() => setMcpApproval({ scope: "global", name: "db", enabled: true }), 400, "bad_request");
  });
});
