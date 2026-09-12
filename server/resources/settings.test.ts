import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ErrorCode } from "@shared/api";
import { ApiError } from "../errors";
import { etagOf } from "../fs";
import { loadSchema } from "../schema";
import { tempHome, type TempHome } from "../testing";
import { readSettings, writeSettings } from "./settings";

const TINY_SCHEMA = JSON.stringify({ type: "object", properties: { model: { type: "string" } } });

let t: TempHome;
beforeEach(async () => {
  t = tempHome();
  t.write(".cluide/schema-cache.json", TINY_SCHEMA);
  await loadSchema();
});
afterEach(() => t.cleanup());

const rejects = (fn: () => unknown, status: number, code: ErrorCode) => {
  try { fn(); } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    expect({ status: (e as ApiError).status, code: (e as ApiError).code }).toEqual({ status, code });
    return;
  }
  throw new Error("expected a throw");
};

describe("readSettings", () => {
  test("returns the parsed file with schema warnings", () => {
    const path = t.write(".claude/settings.json", '{"model":1}');
    expect(readSettings("global", "settings")).toEqual({
      path, exists: true, json: { model: 1 }, etag: etagOf('{"model":1}'),
      errors: [{ path: "/model", message: "must be string" }],
    });
  });
  test("a missing local file is not an error", () => {
    expect(readSettings(t.project, "local")).toEqual({
      path: join(t.project, ".claude", "settings.local.json"), exists: false, json: null, etag: null, errors: [],
    });
  });
  test("keeps raw text when the file does not parse", () => {
    const path = t.write(".claude/settings.json", "{nope");
    expect(readSettings("global", "settings")).toEqual({
      path, exists: true, json: null, raw: "{nope", etag: etagOf("{nope"), errors: [],
    });
  });
  test("rejects an unknown file name", () => {
    rejects(() => readSettings("global", "managed"), 400, "bad_request");
  });
});

describe("writeSettings", () => {
  test("writes the whole document and returns warnings", () => {
    const path = join(t.claude, "settings.json");
    const result = writeSettings({ scope: "global", file: "settings", json: { model: "opus", extra: 1 } });
    expect(result).toEqual({
      etag: etagOf('{\n  "model": "opus",\n  "extra": 1\n}\n'),
      diff: expect.stringContaining('+  "model": "opus"'),
      errors: [{ path: "/extra", message: "not a documented setting" }],
    });
    expect(readFileSync(path, "utf8")).toBe('{\n  "model": "opus",\n  "extra": 1\n}\n');
  });
  test("rejects a non-object body", () => {
    rejects(() => writeSettings({ scope: "global", file: "settings", json: ["x"] }), 422, "unprocessable");
  });
  test("refuses to overwrite a file that does not parse", () => {
    t.write(".claude/settings.json", "{nope");
    rejects(() => writeSettings({ scope: "global", file: "settings", json: {} }), 422, "unprocessable");
  });
  test("returns 409 on a stale etag", () => {
    t.write(".claude/settings.json", "{}");
    rejects(() => writeSettings({ scope: "global", file: "settings", json: {}, etag: "stale" }), 409, "conflict");
  });
});
