import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";

export const homeDir = (): string => readFileSync(fileURLToPath(new URL("./.home", import.meta.url)), "utf8").trim();

export const projectPath = (name: string): string => join(homeDir(), name);

export const projectUrl = (name: string): string => `/p/${encodeURIComponent(projectPath(name))}`;

export const shot = (page: Page, name: string) =>
  page.screenshot({ path: fileURLToPath(new URL(`./renders/${name}.png`, import.meta.url)), animations: "disabled" });

// The toaster renders outside <main>; "Saved" and an error message appear in both, so assert on one side.
export const main = (page: Page) => page.locator("main");
export const toast = (page: Page) => page.getByRole("status");
// A Radix modal marks the toaster aria-hidden; getByRole skips it, a plain locator does not.
export const toastUnderModal = (page: Page) => page.locator('[role="status"]');
