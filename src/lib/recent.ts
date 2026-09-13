import { readStorage, writeStorage } from "./storage";

export interface Recent { label: string; path: string; url: string }

export const readRecent = (): Recent[] => readStorage<Recent[]>("cluide.recent", []);

export function pushRecent(entry: Recent): void {
  // Dedup by path, not url: every file of the same kind shares one screen url
  // ("/global/rules" for every rule), so a url-keyed dedup could only ever remember one file per
  // kind. "The last four files opened" (shell.md) means four distinct files, not four distinct screens.
  const rest = readRecent().filter((r) => r.path !== entry.path);
  writeStorage("cluide.recent", [entry, ...rest].slice(0, 4));
}
