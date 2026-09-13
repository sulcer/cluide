import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import type { WriteResult } from "@shared/api";
import { ApiError } from "./errors";
import { assertAllowed, cluideDir } from "./paths";

const KEEP_BACKUPS = 50;

export const etagOf = (text: string): string => createHash("sha256").update(text).digest("hex");
export const sliceEtag = (value: unknown): string => etagOf(JSON.stringify(value ?? null));
export const jsonText = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export interface TextDoc {
  path: string;
  content: string;
  etag: string;
}

export function readText(path: string): TextDoc | null {
  const real = assertAllowed(path);
  if (!existsSync(real)) return null;
  const content = readFileSync(real, "utf8");
  return { path: real, content, etag: etagOf(content) };
}

export function writeText(path: string, content: string, expectedEtag?: string): WriteResult {
  const real = assertAllowed(path);
  const current = existsSync(real) ? readFileSync(real, "utf8") : null;
  checkEtag(real, current, expectedEtag);
  const backup = current === null ? null : backupOf(real, current);
  mkdirSync(dirname(real), { recursive: true });
  const tmp = `${real}.cluide-tmp`;
  try {
    writeFileSync(tmp, content);
    renameSync(tmp, real);
  } catch (e) {
    if (existsSync(tmp)) unlinkSync(tmp);
    throw new ApiError(500, "internal", `write failed: ${(e as Error).message}`);
  }
  return { etag: etagOf(content), diff: gitDiff(backup ?? "/dev/null", real) };
}

export function deleteText(path: string, expectedEtag?: string): void {
  const real = assertAllowed(path);
  if (!existsSync(real)) throw new ApiError(404, "not_found", `${basename(real)} does not exist`);
  const current = readFileSync(real, "utf8");
  checkEtag(real, current, expectedEtag);
  backupOf(real, current);
  unlinkSync(real);
}

export interface JsonDoc {
  path: string;
  exists: boolean;
  json: Record<string, unknown> | null;
  raw?: string;
  etag: string | null;
}

export function readJsonDoc(path: string): JsonDoc {
  const doc = readText(path);
  if (doc === null) return { path: assertAllowed(path), exists: false, json: null, etag: null };
  try {
    return { path: doc.path, exists: true, json: JSON.parse(doc.content), etag: doc.etag };
  } catch {
    return { path: doc.path, exists: true, json: null, raw: doc.content, etag: doc.etag };
  }
}

// An existing file that does not parse is the user's error to fix, not an empty document.
export function readJsonOrEmpty(path: string): Record<string, any> {
  const doc = readJsonDoc(path);
  if (doc.exists && doc.json === null) {
    throw new ApiError(422, "unprocessable", `${basename(doc.path)} is not valid JSON`);
  }
  return doc.json ?? {};
}

export function patchJson(
  path: string,
  slice: (json: any) => unknown,
  mutate: (json: any) => void,
  expectedEtag?: string,
): WriteResult {
  const json = readJsonOrEmpty(path);
  const before = sliceEtag(slice(json));
  if (expectedEtag !== undefined && before !== expectedEtag) {
    throw new ApiError(409, "conflict", `${basename(path)} changed on disk`, { content: slice(json) ?? null, etag: before });
  }
  mutate(json);
  const { diff } = writeText(path, jsonText(json));
  return { etag: sliceEtag(slice(json)), diff };
}

function checkEtag(real: string, current: string | null, expected?: string): void {
  if (expected === undefined) return;
  const actual = current === null ? null : etagOf(current);
  if (actual !== expected) {
    throw new ApiError(409, "conflict", `${basename(real)} changed on disk`, { content: current, etag: actual });
  }
}

function backupOf(real: string, content: string): string {
  const dir = join(cluideDir(), "backups", real.replaceAll("/", "-"));
  try {
    mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString();
    let name = stamp;
    for (let i = 1; existsSync(join(dir, name)); i++) name = `${stamp}-${i}`;
    writeFileSync(join(dir, name), content);
    for (const old of readdirSync(dir).sort().slice(0, -KEEP_BACKUPS)) unlinkSync(join(dir, old));
    return join(dir, name);
  } catch (e) {
    throw new ApiError(500, "internal", `backup failed: ${(e as Error).message}`);
  }
}

function gitDiff(before: string, after: string): string {
  try {
    return Bun.spawnSync(["git", "diff", "--no-index", "--no-color", before, after]).stdout.toString();
  } catch {
    return "";
  }
}
