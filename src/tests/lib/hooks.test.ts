import { describe, expect, test } from "bun:test";
import { flattenHooks, language, scriptFor } from "@/lib/hooks";

describe("hooks", () => {
  test("flattens events, matchers and hooks in file order", () => {
    const json = {
      hooks: {
        PreToolUse: [{ matcher: ["Bash", "Edit"], hooks: [{ type: "command", command: "a.sh" }, { command: "b.sh" }] }],
        SessionStart: [{ hooks: [{ type: "command", command: "~/.claude/hooks/c.sh" }] }],
      },
    };
    expect(flattenHooks(json, "/h/.claude/settings.json")).toEqual([
      { event: "PreToolUse", matcher: "Bash, Edit", command: "a.sh", type: "command", file: "/h/.claude/settings.json" },
      { event: "PreToolUse", matcher: "Bash, Edit", command: "b.sh", type: "command", file: "/h/.claude/settings.json" },
      { event: "SessionStart", matcher: "*", command: "~/.claude/hooks/c.sh", type: "command", file: "/h/.claude/settings.json" },
    ]);
    expect(flattenHooks(null, "x")).toEqual([]);
    expect(flattenHooks({ hooks: "nope" }, "x")).toEqual([]);
  });

  test("links a command to a script by its first token", () => {
    const scripts = [{ name: "c.sh", path: "/h/.claude/hooks/c.sh", exists: true }];
    expect(scriptFor("~/.claude/hooks/c.sh --fast", scripts)).toEqual(scripts[0]);
    expect(scriptFor("/h/.claude/hooks/c.sh", scripts)).toEqual(scripts[0]);
    expect(scriptFor("python3 /h/.claude/hooks/c.sh", scripts)).toBeUndefined();
    expect(scriptFor("echo hi", scripts)).toBeUndefined();
  });

  test("language from the extension", () => {
    expect([language("a.py"), language("b.sh"), language("c.rb"), language("Makefile")]).toEqual(["python", "bash", "rb", "Makefile"]);
  });
});
