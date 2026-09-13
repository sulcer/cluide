import { readStorage, writeStorage } from "./storage";

export interface Recent { label: string; path: string; url: string }

export const readRecent = (): Recent[] => readStorage<Recent[]>("cluide.recent", []);

export function pushRecent(entry: Recent): void {
  const rest = readRecent().filter((r) => r.url !== entry.url);
  writeStorage("cluide.recent", [entry, ...rest].slice(0, 4));
}
