import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import type { FileDoc, FileEntry, FileKind, Scope, WriteResult } from "@shared/api";
import { ApiError, requireString } from "../errors";
import { deleteText, readText, writeText } from "../fs";
import { assertScope, claudeDir } from "../paths";

// Directory kinds and the extension they list; null lists every regular file.
const DIR_KINDS: Partial<Record<FileKind, string | null>> = {
  rules: ".md",
  agents: ".md",
  commands: ".md",
  hooks: null,
};

const root = (scope: Scope): string => (scope === "global" ? claudeDir() : join(scope, ".claude"));

export function listFiles(scopeArg: string, kind: string): FileEntry[] {
  const scope = assertScope(scopeArg);
  if (kind === "memory") {
    const paths =
      scope === "global"
        ? [join(claudeDir(), "CLAUDE.md")]
        : [join(scope, "CLAUDE.md"), join(scope, "CLAUDE.local.md")];
    return paths.map(fixed);
  }
  if (kind === "keybindings") {
    if (scope !== "global") throw new ApiError(400, "bad_request", "keybindings exist only in global scope");
    return [fixed(join(claudeDir(), "keybindings.json"))];
  }
  if (kind === "skills") {
    const dir = join(root(scope), "skills");
    return subdirs(dir)
      .filter((name) => existsSync(join(dir, name, "SKILL.md")))
      .map((name) => ({ name: `${name}/SKILL.md`, path: join(dir, name, "SKILL.md"), exists: true }));
  }
  if (kind in DIR_KINDS) {
    const ext = DIR_KINDS[kind as FileKind] ?? null;
    const dir = join(root(scope), kind);
    return files(dir)
      .filter((name) => ext === null || name.endsWith(ext))
      .map((name) => ({ name, path: join(dir, name), exists: true }));
  }
  throw new ApiError(400, "bad_request", `unknown kind: ${kind}`);
}

const fixed = (path: string): FileEntry => ({ name: basename(path), path, exists: existsSync(path) });

const files = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => statSync(join(dir, f)).isFile())
        .sort()
    : [];

const subdirs = (dir: string): string[] =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => statSync(join(dir, f)).isDirectory())
        .sort()
    : [];

export function readFile(path: string): FileDoc {
  const doc = readText(path);
  if (doc === null) throw new ApiError(404, "not_found", `${path} does not exist`);
  return doc;
}

export function writeFile(body: unknown): WriteResult {
  const path = requireString(body, "path");
  const content = requireString(body, "content", true);
  const etag = (body as { etag?: string }).etag;
  return writeText(path, content, etag);
}

export function createFile(body: unknown): { etag: string } {
  const path = requireString(body, "path");
  const content = requireString(body, "content", true);
  if (readText(path) !== null) throw new ApiError(409, "conflict", `${path} already exists`);
  return { etag: writeText(path, content).etag };
}

export function deleteFile(path: string, etag?: string): void {
  deleteText(path, etag);
}
