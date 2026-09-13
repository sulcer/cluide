import { useSyncExternalStore } from "react";
import { writeStorage } from "./storage";

export type Theme = "dark" | "light";

const listeners = new Set<() => void>();
const current = (): Theme => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  writeStorage("cluide.theme", theme);
  for (const l of listeners) l();
}

export const toggleTheme = (): void => setTheme(current() === "dark" ? "light" : "dark");

export const useTheme = (): Theme =>
  useSyncExternalStore((l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  }, current);
