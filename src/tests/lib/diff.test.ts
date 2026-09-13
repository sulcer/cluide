import { describe, expect, test } from "bun:test";
import { parseUnifiedDiff } from "@/lib/diff";

const DIFF = [
  "diff --git a/CLAUDE.md b/CLAUDE.md",
  "index 1111111..2222222 100644",
  "--- a/CLAUDE.md",
  "+++ b/CLAUDE.md",
  "@@ -1,3 +1,4 @@",
  " # Title",
  "-old line",
  "+new line",
  "+added line",
  " end",
  "",
].join("\n");

describe("parseUnifiedDiff", () => {
  test("numbers every line and counts changes", () => {
    expect(parseUnifiedDiff(DIFF)).toEqual({
      added: 2,
      removed: 1,
      lines: [
        { kind: "meta", sign: "", text: "diff --git a/CLAUDE.md b/CLAUDE.md" },
        { kind: "meta", sign: "", text: "index 1111111..2222222 100644" },
        { kind: "meta", sign: "", text: "--- a/CLAUDE.md" },
        { kind: "meta", sign: "", text: "+++ b/CLAUDE.md" },
        { kind: "meta", sign: "", text: "@@ -1,3 +1,4 @@" },
        { kind: "ctx", sign: "", old: 1, new: 1, text: "# Title" },
        { kind: "del", sign: "-", old: 2, text: "old line" },
        { kind: "add", sign: "+", new: 2, text: "new line" },
        { kind: "add", sign: "+", new: 3, text: "added line" },
        { kind: "ctx", sign: "", old: 3, new: 4, text: "end" },
      ],
    });
  });

  test("an empty diff is empty", () => {
    expect(parseUnifiedDiff("")).toEqual({ lines: [], added: 0, removed: 0 });
  });
});
