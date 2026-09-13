import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import type { ErrorCode } from "@shared/api";
import { ApiError } from "../errors";
import { assertAllowed, assertScope, projectPaths } from "../paths";
import { type TempHome, tempHome } from "./temp-home";

let t: TempHome;
beforeEach(() => {
  t = tempHome();
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

describe("assertScope", () => {
  test("accepts global and a listed project", () => {
    expect([assertScope("global"), assertScope(t.project)]).toEqual(["global", t.project]);
  });
  test("rejects an unlisted directory", () => {
    rejects(() => assertScope(t.home), 400, "bad_request");
  });
});

describe("projectPaths", () => {
  test("reads the projects map", () => {
    expect(projectPaths()).toEqual([t.project]);
  });
});

describe("assertAllowed", () => {
  test("allows files under ~/.claude, ~/.claude.json, and project config files", () => {
    expect([
      assertAllowed(join(t.claude, "CLAUDE.md")),
      assertAllowed(join(t.claude, "hooks", "new.sh")),
      assertAllowed(join(t.home, ".claude.json")),
      assertAllowed(join(t.project, "CLAUDE.md")),
      assertAllowed(join(t.project, "CLAUDE.local.md")),
      assertAllowed(join(t.project, ".mcp.json")),
      assertAllowed(join(t.project, ".claude", "settings.local.json")),
    ]).toEqual([
      join(t.claude, "CLAUDE.md"),
      join(t.claude, "hooks", "new.sh"),
      join(t.home, ".claude.json"),
      join(t.project, "CLAUDE.md"),
      join(t.project, "CLAUDE.local.md"),
      join(t.project, ".mcp.json"),
      join(t.project, ".claude", "settings.local.json"),
    ]);
  });
  test("rejects a relative path", () => {
    rejects(() => assertAllowed(".claude/CLAUDE.md"), 400, "bad_request");
  });
  test("rejects traversal out of ~/.claude", () => {
    rejects(() => assertAllowed(join(t.claude, "..", "secret.txt")), 400, "bad_request");
  });
  test("rejects a project file that is not a config file", () => {
    rejects(() => assertAllowed(join(t.project, "src", "index.ts")), 400, "bad_request");
  });
  test("rejects a symlink under ~/.claude that points outside it", () => {
    mkdirSync(join(t.home, "outside"));
    symlinkSync(join(t.home, "outside"), join(t.claude, "link"));
    rejects(() => assertAllowed(join(t.claude, "link", "x.md")), 400, "bad_request");
  });
});
