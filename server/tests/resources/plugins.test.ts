import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ErrorCode } from "@shared/api";
import { ApiError } from "../../errors";
import { sliceEtag } from "../../fs";
import { listPlugins, setPluginEnabled } from "../../resources/plugins";
import { type TempHome, tempHome } from "../temp-home";

let t: TempHome;
let installA: string;
let installB: string;
beforeEach(() => {
  t = tempHome();
  installA = join(t.claude, "plugins", "cache", "shop", "alpha", "1.0.0");
  installB = join(t.claude, "plugins", "cache", "shop", "beta", "2.0.0");
  t.write(
    ".claude/plugins/installed_plugins.json",
    JSON.stringify({
      version: 2,
      plugins: {
        "beta@shop": [
          {
            scope: "user",
            installPath: installB,
            version: "2.0.0",
            installedAt: "2026-01-01T00:00:00Z",
            lastUpdated: "2026-02-01T00:00:00Z",
          },
        ],
        "alpha@shop": [
          {
            scope: "user",
            installPath: join(t.claude, "old"),
            version: "0.9.0",
            installedAt: "2025-01-01T00:00:00Z",
            lastUpdated: "2025-01-01T00:00:00Z",
          },
          {
            scope: "user",
            installPath: installA,
            version: "1.0.0",
            installedAt: "2026-01-01T00:00:00Z",
            lastUpdated: "2026-03-01T00:00:00Z",
          },
        ],
      },
    }),
  );
  t.write(
    ".claude/plugins/known_marketplaces.json",
    JSON.stringify({
      shop: {
        source: { source: "github", repo: "acme/shop" },
        installLocation: "/x",
        lastUpdated: "2026-01-01T00:00:00Z",
      },
    }),
  );
  t.write(".claude/settings.json", JSON.stringify({ enabledPlugins: { "alpha@shop": true }, model: "opus" }));
  t.write(".claude/plugins/cache/shop/alpha/1.0.0/.mcp.json", "{}");
  t.write(".claude/plugins/cache/shop/beta/2.0.0/hooks/hooks.json", "{}");
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

describe("listPlugins", () => {
  test("joins the registries and settings, newest install wins, sorted by id", () => {
    const etag = sliceEtag({ "alpha@shop": true });
    expect(listPlugins()).toEqual([
      {
        id: "alpha@shop",
        name: "alpha",
        marketplace: "shop",
        marketplaceSource: "acme/shop",
        version: "1.0.0",
        installPath: installA,
        enabled: true,
        hasMcp: true,
        hasHooks: false,
        etag,
      },
      {
        id: "beta@shop",
        name: "beta",
        marketplace: "shop",
        marketplaceSource: "acme/shop",
        version: "2.0.0",
        installPath: installB,
        enabled: false,
        hasMcp: false,
        hasHooks: true,
        etag,
      },
    ]);
  });
  test("an empty registry lists nothing", () => {
    t.write(".claude/plugins/installed_plugins.json", JSON.stringify({ version: 2, plugins: {} }));
    expect(listPlugins()).toEqual([]);
  });
});

describe("setPluginEnabled", () => {
  test("changes only enabledPlugins and leaves every other key alone", () => {
    const result = setPluginEnabled({ id: "beta@shop", enabled: true, etag: sliceEtag({ "alpha@shop": true }) });
    expect(result).toEqual({
      etag: sliceEtag({ "alpha@shop": true, "beta@shop": true }),
      diff: expect.stringContaining('+    "beta@shop": true'),
    });
    expect(JSON.parse(readFileSync(join(t.claude, "settings.json"), "utf8"))).toEqual({
      enabledPlugins: { "alpha@shop": true, "beta@shop": true },
      model: "opus",
    });
  });
  test("404 for a plugin that is not installed", () => {
    rejects(() => setPluginEnabled({ id: "ghost@shop", enabled: true }), 404, "not_found");
  });
  test("409 on a stale etag", () => {
    rejects(() => setPluginEnabled({ id: "beta@shop", enabled: true, etag: "stale" }), 409, "conflict");
  });
});
