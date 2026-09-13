import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const STATUS = /^Status: (Draft|Stable) · (Built|Partial|Planned) · \d{4}-\d{2}-\d{2} · .+$/;
const LINK = /\]\((\.{1,2}\/[^)#\s]+)/g;
const TEXT = /\.(md|ts|tsx|json|css|yml|yaml|html|svg|txt)$/;
const SKIP = ["node_modules", "dist", ".git", "e2e/renders", "docs/spec/ui/design", ".agents", ".claude/skills", ".superpowers"];

function* walk(root: string, dir = root): Generator<string> {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    const rel = relative(root, path);
    if (SKIP.some((s) => rel === s || rel.startsWith(`${s}/`))) continue;
    if (statSync(path).isDirectory()) yield* walk(root, path);
    else yield path;
  }
}

// Every violation as "<relative path>:<line> <message>", sorted, so CI output is stable.
export function checkDocs(root: string, forbidden: string[]): string[] {
  const out: string[] = [];
  const names = forbidden.map((n) => n.trim()).filter(Boolean).map((n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"));
  for (const path of walk(root)) {
    const rel = relative(root, path);
    if (!TEXT.test(rel)) continue;
    const lines = readFileSync(path, "utf8").split("\n");
    // Links and status lines matter only under docs/ and in CLAUDE.md; the names check below
    // still covers every text file in the tree.
    if (rel.endsWith(".md") && (rel === "CLAUDE.md" || rel.startsWith("docs/"))) {
      // Links inside fenced code blocks are examples, not references.
      let fenced = false;
      lines.forEach((line, i) => {
        if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
        if (fenced) return;
        for (const m of line.matchAll(LINK)) {
          if (!existsSync(resolve(dirname(path), m[1]))) out.push(`${rel}:${i + 1} broken link: ${m[1]}`);
        }
      });
      if (rel.startsWith("docs/spec/") && rel !== "docs/spec/README.md" && rel.endsWith(".md") && !rel.endsWith("design-brief.md")) {
        if (!STATUS.test(lines[2] ?? "")) out.push(`${rel}:3 status line must read \`Status: <Draft|Stable> · <Built|Partial|Planned> · <date> · <sentence>\``);
      }
    }
    lines.forEach((line, i) => {
      for (const [k, re] of names.entries()) if (re.test(line)) out.push(`${rel}:${i + 1} forbidden name: ${forbidden[k].trim().toLowerCase()}`);
    });
  }
  return out.sort();
}

if (import.meta.main) {
  const names = (process.env.FORBIDDEN_NAMES ?? "").split(",").map((n) => n.trim()).filter(Boolean);
  if (names.length === 0) console.log("FORBIDDEN_NAMES is not set; the names check is skipped");
  const violations = checkDocs(process.cwd(), names);
  for (const v of violations) console.log(v);
  console.log(violations.length === 0 ? "docs ok" : `${violations.length} violation(s)`);
  process.exit(violations.length === 0 ? 0 : 1);
}
