import { existsSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import type { Scope } from "@shared/api";
import { ApiError } from "./errors";

export const home = (): string => process.env.HOME ?? homedir();
export const claudeDir = (): string => join(home(), ".claude");
export const claudeJsonPath = (): string => join(home(), ".claude.json");
export const cluideDir = (): string => join(home(), ".cluide");

export function projectPaths(): string[] {
  const path = claudeJsonPath();
  if (!existsSync(path)) return [];
  let json: { projects?: Record<string, unknown> };
  try {
    json = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new ApiError(422, "unprocessable", ".claude.json is not valid JSON");
  }
  return Object.keys(json.projects ?? {});
}

export function assertScope(scope: string): Scope {
  if (scope === "global") return scope;
  if (isAbsolute(scope) && projectPaths().includes(scope)) return scope;
  throw new ApiError(400, "bad_request", `unknown scope: ${scope}`);
}

// realpath of the deepest existing ancestor, plus the not-yet-existing remainder.
function realpathDeep(absolute: string): string {
  let dir = absolute;
  const rest: string[] = [];
  while (!existsSync(dir)) {
    rest.unshift(basename(dir));
    dir = dirname(dir);
  }
  return join(realpathSync(dir), ...rest);
}

const PROJECT_FILES = ["CLAUDE.md", "CLAUDE.local.md", ".mcp.json"];

function isInside(root: string, path: string): boolean {
  const rel = relative(root, path);
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

export function assertAllowed(path: string): string {
  if (!isAbsolute(path)) throw new ApiError(400, "bad_request", "path must be absolute");
  const real = realpathDeep(resolve(path));
  if (real === realpathDeep(claudeJsonPath()) || isInside(realpathDeep(claudeDir()), real)) return real;
  for (const project of projectPaths()) {
    if (!existsSync(project)) continue;
    const root = realpathSync(project);
    if (!isInside(root, real)) continue;
    const rel = relative(root, real);
    if (PROJECT_FILES.includes(rel) || rel.startsWith(`.claude${sep}`)) return real;
  }
  throw new ApiError(400, "bad_request", `path not allowed: ${path}`);
}
