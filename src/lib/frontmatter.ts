export interface Frontmatter {
  name?: string;
  description?: string;
}

export function parseFrontmatter(content: string): Frontmatter | null {
  if (!content.startsWith("---\n")) return null;
  const end = content.indexOf("\n---", 4);
  if (end < 0) return null;
  const out: Frontmatter = {};
  for (const line of content.slice(4, end).split("\n")) {
    const m = /^(name|description):\s*(.*)$/.exec(line);
    if (m) out[m[1] as keyof Frontmatter] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}
