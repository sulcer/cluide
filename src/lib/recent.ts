import { readStorage, writeStorage } from "./storage";

export interface Recent { label: string; path: string; url: string }

export const readRecent = (): Recent[] => readStorage<Recent[]>("cluide.recent", []);

export function pushRecent(entry: Recent): void {
  // Dedup by path, not url: every file of one kind shares the same screen url.
  const rest = readRecent().filter((r) => r.path !== entry.path);
  writeStorage("cluide.recent", [entry, ...rest].slice(0, 4));
}
