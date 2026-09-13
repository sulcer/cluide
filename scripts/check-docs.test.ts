import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkDocs } from "./check-docs";

const tree = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), "cluide-docs-"));
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(root, rel, ".."), { recursive: true });
    writeFileSync(join(root, rel), content);
  }
  return root;
};

describe("checkDocs", () => {
  test("reports a broken link, a bad status line and a forbidden name, once each, and ignores fenced examples", () => {
    const root = tree({
      "docs/spec/a/README.md": "# A\n\nStatus: Stable · Built · 2026-09-13 · Fine.\n\nSee [b](./missing.md).\n\n```md\n[example](./also-missing.md)\n```\n",
      "docs/spec/b/README.md": "# B\n\nStatus: done\n",
      "docs/notes.md": "Mentions Acme Corp here.\n",
    });
    try {
      expect(checkDocs(root, ["acme corp"])).toEqual([
        "docs/notes.md:1 forbidden name: acme corp",
        "docs/spec/a/README.md:5 broken link: ./missing.md",
        "docs/spec/b/README.md:3 status line must read `Status: <Draft|Stable> · <Built|Partial|Planned> · <date> · <sentence>`",
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("a clean tree has no violations", () => {
    const root = tree({ "docs/spec/a/README.md": "# A\n\nStatus: Draft · Planned · 2026-09-13 · Fine.\n" });
    try {
      expect(checkDocs(root, [])).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
