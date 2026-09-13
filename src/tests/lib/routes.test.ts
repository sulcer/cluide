import { describe, expect, test } from "bun:test";
import { decodeProject, kindDir, scopeName, scopeUrl, screenUrl, visibleScreens } from "@/lib/routes";

describe("routes", () => {
  test("a project path round-trips through the url", () => {
    expect(scopeUrl("/Users/me/my repo")).toBe("/p/%2FUsers%2Fme%2Fmy%20repo");
    // react-router's useParams() decodes every escape, %2F included, before cluide sees it
    expect(decodeProject("/Users/me/my repo")).toBe("/Users/me/my repo");
    expect(decodeProject("/Users/me/repo")).toBe("/Users/me/repo");
  });

  test("global-only screens hide in a project", () => {
    expect(visibleScreens("global").map((s) => s.id)).toEqual([
      "settings", "memory", "rules", "keybindings", "agents", "skills", "commands", "hooks", "plugins", "mcp",
    ]);
    expect(visibleScreens("/Users/me/repo").map((s) => s.id)).toEqual([
      "settings", "memory", "rules", "agents", "skills", "commands", "hooks", "mcp",
    ]);
  });

  test("names, urls and directories", () => {
    expect(scopeName("global")).toBe("Global");
    expect(scopeName("/Users/me/repo/")).toBe("repo");
    expect(screenUrl("global", "mcp")).toBe("/global/mcp");
    expect(kindDir("global", "rules", "/Users/me/.claude")).toBe("/Users/me/.claude/rules");
    expect(kindDir("/Users/me/repo", "skills", null)).toBe("/Users/me/repo/.claude/skills");
  });
});
