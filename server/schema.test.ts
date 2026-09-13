import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { loadSchema, schemaAvailable, validateSettings } from "./schema";
import { tempHome, type TempHome } from "./testing";

const TINY_SCHEMA = JSON.stringify({
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  additionalProperties: true,
  properties: {
    model: { type: "string" },
    hooks: { type: "object" },
  },
});

let t: TempHome;
const realFetch = globalThis.fetch;
beforeEach(() => { t = tempHome(); });
afterEach(() => { globalThis.fetch = realFetch; t.cleanup(); });

describe("loadSchema", () => {
  test("uses a fresh cache without fetching", async () => {
    t.write(".cluide/schema-cache.json", TINY_SCHEMA);
    globalThis.fetch = (() => { throw new Error("must not fetch"); }) as unknown as typeof fetch;
    expect([await loadSchema(), schemaAvailable()]).toEqual([true, true]);
  });
  test("reports unavailable when there is no cache and the fetch fails", async () => {
    globalThis.fetch = (() => Promise.reject(new Error("offline"))) as unknown as typeof fetch;
    expect([await loadSchema(), schemaAvailable()]).toEqual([false, false]);
  });
  test("caches a fetched schema to disk", async () => {
    globalThis.fetch = (() => Promise.resolve(new Response(TINY_SCHEMA))) as unknown as typeof fetch;
    await loadSchema();
    expect(await Bun.file(join(t.home, ".cluide", "schema-cache.json")).text()).toBe(TINY_SCHEMA);
  });
});

describe("validateSettings", () => {
  test("reports schema violations with a JSON pointer and unknown top-level keys", async () => {
    t.write(".cluide/schema-cache.json", TINY_SCHEMA);
    await loadSchema();
    expect(validateSettings({ model: 42, mcpServers: {} })).toEqual([
      { path: "/model", message: "must be string" },
      { path: "/mcpServers", message: "not a documented setting" },
    ]);
  });
  test("returns nothing when the schema is unavailable", async () => {
    globalThis.fetch = (() => Promise.reject(new Error("offline"))) as unknown as typeof fetch;
    await loadSchema();
    expect(validateSettings({ model: 42 })).toEqual([]);
  });
});
