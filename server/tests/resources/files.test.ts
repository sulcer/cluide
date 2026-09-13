import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ErrorCode } from "@shared/api";
import { ApiError } from "../../errors";
import { etagOf } from "../../fs";
import { tempHome, type TempHome } from "../temp-home";
import { createFile, deleteFile, listFiles, readFile, writeFile } from "../../resources/files";

let t: TempHome;
beforeEach(() => { t = tempHome(); });
afterEach(() => t.cleanup());

const rejects = (fn: () => unknown, status: number, code: ErrorCode) => {
  try { fn(); } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    expect({ status: (e as ApiError).status, code: (e as ApiError).code }).toEqual({ status, code });
    return;
  }
  throw new Error("expected a throw");
};

describe("listFiles", () => {
  test("memory in global scope is one fixed entry that may not exist", () => {
    expect(listFiles("global", "memory")).toEqual([
      { name: "CLAUDE.md", path: join(t.claude, "CLAUDE.md"), exists: false },
    ]);
  });
  test("memory in project scope lists both fixed names", () => {
    t.write("repo/CLAUDE.md", "# repo\n");
    expect(listFiles(t.project, "memory")).toEqual([
      { name: "CLAUDE.md", path: join(t.project, "CLAUDE.md"), exists: true },
      { name: "CLAUDE.local.md", path: join(t.project, "CLAUDE.local.md"), exists: false },
    ]);
  });
  test("rules lists markdown files in the scope's rules directory", () => {
    t.write(".claude/rules/b.md", "");
    t.write(".claude/rules/a.md", "");
    t.write(".claude/rules/notes.txt", "");
    expect(listFiles("global", "rules")).toEqual([
      { name: "a.md", path: join(t.claude, "rules", "a.md"), exists: true },
      { name: "b.md", path: join(t.claude, "rules", "b.md"), exists: true },
    ]);
  });
  test("hooks lists every regular file", () => {
    t.write("repo/.claude/hooks/lint.sh", "");
    t.write("repo/.claude/hooks/check.py", "");
    expect(listFiles(t.project, "hooks")).toEqual([
      { name: "check.py", path: join(t.project, ".claude", "hooks", "check.py"), exists: true },
      { name: "lint.sh", path: join(t.project, ".claude", "hooks", "lint.sh"), exists: true },
    ]);
  });
  test("skills lists SKILL.md per subdirectory", () => {
    t.write(".claude/skills/one/SKILL.md", "");
    t.write(".claude/skills/one/notes.md", "");
    t.write(".claude/skills/empty/README.md", "");
    expect(listFiles("global", "skills")).toEqual([
      { name: "one/SKILL.md", path: join(t.claude, "skills", "one", "SKILL.md"), exists: true },
    ]);
  });
  test("a missing directory lists nothing", () => {
    expect(listFiles("global", "agents")).toEqual([]);
  });
  test("keybindings is global only", () => {
    expect(listFiles("global", "keybindings")).toEqual([
      { name: "keybindings.json", path: join(t.claude, "keybindings.json"), exists: false },
    ]);
    rejects(() => listFiles(t.project, "keybindings"), 400, "bad_request");
  });
  test("rejects an unknown kind", () => {
    rejects(() => listFiles("global", "secrets"), 400, "bad_request");
  });
});

describe("readFile", () => {
  test("returns the document", () => {
    const path = t.write(".claude/CLAUDE.md", "hi\n");
    expect(readFile(path)).toEqual({ path, content: "hi\n", etag: etagOf("hi\n") });
  });
  test("404 when missing", () => {
    rejects(() => readFile(join(t.claude, "CLAUDE.md")), 404, "not_found");
  });
});

describe("writeFile, createFile, deleteFile", () => {
  test("writeFile validates the body", () => {
    rejects(() => writeFile({ path: join(t.claude, "CLAUDE.md") }), 400, "bad_request");
  });
  test("writeFile writes through the primitive", () => {
    const path = join(t.claude, "CLAUDE.md");
    expect(writeFile({ path, content: "x\n" })).toEqual({ etag: etagOf("x\n"), diff: expect.stringContaining("+x") });
  });
  test("createFile refuses an existing file", () => {
    const path = t.write(".claude/rules/a.md", "a");
    rejects(() => createFile({ path, content: "b" }), 409, "conflict");
  });
  test("createFile creates and returns the etag", () => {
    const path = join(t.claude, "rules", "a.md");
    expect(createFile({ path, content: "a\n" })).toEqual({ etag: etagOf("a\n") });
  });
  test("deleteFile removes the file", () => {
    const path = t.write(".claude/rules/a.md", "a");
    deleteFile(path, etagOf("a"));
    expect(existsSync(path)).toBe(false);
  });
});
