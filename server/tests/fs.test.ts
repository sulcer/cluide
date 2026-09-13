import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ErrorCode } from "@shared/api";
import { ApiError } from "../errors";
import { deleteText, etagOf, patchJson, readJsonDoc, readText, sliceEtag, writeText } from "../fs";
import { type TempHome, tempHome } from "./temp-home";

let t: TempHome;
beforeEach(() => {
  t = tempHome();
});
afterEach(() => t.cleanup());

const backupDir = (path: string) => join(t.home, ".cluide", "backups", path.replaceAll("/", "-"));

const rejects = (fn: () => unknown, status: number, code: ErrorCode): ApiError => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    expect({ status: (e as ApiError).status, code: (e as ApiError).code }).toEqual({ status, code });
    return e as ApiError;
  }
  throw new Error("expected a throw");
};

describe("readText", () => {
  test("returns content and etag", () => {
    const path = t.write(".claude/CLAUDE.md", "hello\n");
    expect(readText(path)).toEqual({ path, content: "hello\n", etag: etagOf("hello\n") });
  });
  test("returns null for a missing file", () => {
    expect(readText(join(t.claude, "missing.md"))).toBeNull();
  });
});

describe("writeText", () => {
  test("creates a file, returns its etag and a diff against nothing", () => {
    const path = join(t.claude, "rules", "new.md");
    const result = writeText(path, "one\n");
    expect(result).toEqual({ etag: etagOf("one\n"), diff: expect.stringContaining("+one") });
    expect(readFileSync(path, "utf8")).toBe("one\n");
  });
  test("overwrites when the etag matches and returns the diff", () => {
    const path = t.write(".claude/CLAUDE.md", "old\n");
    const result = writeText(path, "new\n", etagOf("old\n"));
    expect(result).toEqual({ etag: etagOf("new\n"), diff: expect.stringContaining("-old\n+new") });
  });
  test("returns 409 with the current content when the etag differs and writes nothing", () => {
    const path = t.write(".claude/CLAUDE.md", "disk\n");
    const error = rejects(() => writeText(path, "mine\n", etagOf("stale\n")), 409, "conflict");
    expect(error.current).toEqual({ content: "disk\n", etag: etagOf("disk\n") });
    expect(readFileSync(path, "utf8")).toBe("disk\n");
  });
  test("leaves no temp file behind", () => {
    const path = t.write(".claude/CLAUDE.md", "a\n");
    writeText(path, "b\n");
    expect(readdirSync(t.claude)).toEqual(["CLAUDE.md"]);
  });
  test("backs up the previous content before writing", () => {
    const path = t.write(".claude/CLAUDE.md", "before\n");
    writeText(path, "after\n");
    const backups = readdirSync(backupDir(path));
    expect(backups).toHaveLength(1);
    expect(readFileSync(join(backupDir(path), backups[0]), "utf8")).toBe("before\n");
  });
  test("keeps only the last 50 backups", () => {
    const path = t.write(".claude/CLAUDE.md", "0\n");
    for (let i = 1; i <= 55; i++) writeText(path, `${i}\n`);
    expect(readdirSync(backupDir(path))).toHaveLength(50);
  });
  test("aborts the write when the backup cannot be taken", () => {
    const path = t.write(".claude/CLAUDE.md", "keep\n");
    t.write(".cluide/backups", "not a directory");
    rejects(() => writeText(path, "lost\n"), 500, "internal");
    expect(readFileSync(path, "utf8")).toBe("keep\n");
  });
  test("rejects a path outside the roots", () => {
    rejects(() => writeText(join(t.home, "elsewhere.txt"), "x"), 400, "bad_request");
  });
});

describe("deleteText", () => {
  test("backs up then removes the file", () => {
    const path = t.write(".claude/rules/old.md", "bye\n");
    deleteText(path, etagOf("bye\n"));
    expect({ exists: existsSync(path), backups: readdirSync(backupDir(path)).length }).toEqual({
      exists: false,
      backups: 1,
    });
  });
  test("returns 404 for a missing file", () => {
    rejects(() => deleteText(join(t.claude, "nope.md")), 404, "not_found");
  });
});

describe("readJsonDoc", () => {
  test("parses a JSON file", () => {
    const path = t.write(".claude/settings.json", '{"a":1}');
    expect(readJsonDoc(path)).toEqual({ path, exists: true, json: { a: 1 }, etag: etagOf('{"a":1}') });
  });
  test("reports a missing file", () => {
    const path = join(t.claude, "settings.local.json");
    expect(readJsonDoc(path)).toEqual({ path, exists: false, json: null, etag: null });
  });
  test("keeps the raw text when the file does not parse", () => {
    const path = t.write(".claude/settings.json", "{oops");
    expect(readJsonDoc(path)).toEqual({ path, exists: true, json: null, raw: "{oops", etag: etagOf("{oops") });
  });
});

describe("patchJson", () => {
  const path = () => join(t.home, ".claude.json");
  const slice = (j: any) => j.mcpServers;

  test("mutates only the slice and preserves other keys", () => {
    t.write(".claude.json", JSON.stringify({ other: { keep: true }, mcpServers: {} }));
    const result = patchJson(path(), slice, (j) => {
      j.mcpServers.x = { command: "x" };
    });
    expect(result).toEqual({ etag: sliceEtag({ x: { command: "x" } }), diff: expect.stringContaining('+    "x"') });
    expect(JSON.parse(readFileSync(path(), "utf8"))).toEqual({
      other: { keep: true },
      mcpServers: { x: { command: "x" } },
    });
  });
  test("returns 409 when the slice etag differs, even if the rest of the file changed too", () => {
    t.write(".claude.json", JSON.stringify({ mcpServers: { a: { command: "a" } }, cache: 1 }));
    const error = rejects(() => patchJson(path(), slice, () => {}, sliceEtag({})), 409, "conflict");
    expect(error.current).toEqual({ content: { a: { command: "a" } }, etag: sliceEtag({ a: { command: "a" } }) });
  });
  test("ignores unrelated changes when the slice etag matches", () => {
    t.write(".claude.json", JSON.stringify({ mcpServers: { a: { command: "a" } }, cache: 2 }));
    const result = patchJson(
      path(),
      slice,
      (j) => {
        delete j.mcpServers.a;
      },
      sliceEtag({ a: { command: "a" } }),
    );
    expect(result.etag).toBe(sliceEtag({}));
  });
  test("creates the file when it does not exist", () => {
    const local = join(t.project, ".claude", "settings.local.json");
    patchJson(
      local,
      (j) => j.enabledMcpjsonServers,
      (j) => {
        j.enabledMcpjsonServers = ["db"];
      },
    );
    expect(JSON.parse(readFileSync(local, "utf8"))).toEqual({ enabledMcpjsonServers: ["db"] });
  });
  test("returns 422 when the file does not parse", () => {
    t.write(".claude.json", "{broken");
    rejects(() => patchJson(path(), slice, () => {}), 422, "unprocessable");
  });
});
