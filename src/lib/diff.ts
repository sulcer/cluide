export interface DiffLine {
  kind: "add" | "del" | "ctx" | "meta";
  sign: string;
  old?: number;
  new?: number;
  text: string;
}
export interface ParsedDiff {
  lines: DiffLine[];
  added: number;
  removed: number;
}

export function parseUnifiedDiff(diff: string): ParsedDiff {
  const lines: DiffLine[] = [];
  let added = 0;
  let removed = 0;
  let oldN = 0;
  let newN = 0;
  let inHunk = false;
  for (const raw of diff.split("\n")) {
    if (raw === "") continue;
    const hunk = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw);
    if (hunk) {
      oldN = Number(hunk[1]);
      newN = Number(hunk[2]);
      inHunk = true;
      lines.push({ kind: "meta", sign: "", text: raw });
    } else if (!inHunk || raw.startsWith("\\")) {
      lines.push({ kind: "meta", sign: "", text: raw });
    } else if (raw.startsWith("+")) {
      added++;
      lines.push({ kind: "add", sign: "+", new: newN++, text: raw.slice(1) });
    } else if (raw.startsWith("-")) {
      removed++;
      lines.push({ kind: "del", sign: "-", old: oldN++, text: raw.slice(1) });
    } else {
      lines.push({ kind: "ctx", sign: "", old: oldN++, new: newN++, text: raw.slice(1) });
    }
  }
  return { lines, added, removed };
}
