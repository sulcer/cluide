import { existsSync } from "node:fs";
import { basename } from "node:path";
import type { Project } from "@shared/api";
import { home, projectPaths } from "../paths";

export function listProjects(): Project[] {
  return projectPaths()
    .map((path) => ({ path, name: path === home() ? "~" : basename(path), exists: existsSync(path) }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}
