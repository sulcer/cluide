import { expect, test } from "@playwright/test";
import { main, projectUrl, shot, toast } from "./helpers";

test.describe("render", () => {
  test("shell: fonts load and / redirects", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/global\/settings$/);
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).fontFamily))
      .toMatch(/^"?Inter Variable/);
    // fonts.check() is true when no such face exists at all; load() returns the faces it found.
    const faces = await page.evaluate(() => document.fonts.load('13px "Inter Variable"').then((f) => f.length));
    expect(faces).toBeGreaterThan(0);
    await shot(page, "shell");
  });

  test("shell-collapsed", async ({ page }) => {
    await page.goto("/global/settings");
    await page.getByRole("button", { name: "Toggle sidebar" }).click();
    await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0);
    await shot(page, "shell-collapsed");
    await page.reload();
    await expect(page.getByRole("link", { name: "Settings" })).toHaveCount(0); // persisted
    await page.getByRole("button", { name: "Toggle sidebar" }).click();
  });

  test("shell-scope-open", async ({ page }) => {
    await page.goto("/global/settings");
    await page.getByRole("button", { name: /Global/ }).first().click();
    await expect(page.getByPlaceholder("Switch scope")).toBeFocused();
    await expect(page.getByText("4 projects")).toBeVisible();
    await shot(page, "shell-scope-open");
    await page.getByText("fetcher", { exact: true }).click();
    await expect(page).toHaveURL(/\/p\/.*fetcher\/settings$/);
  });

  test("command-menu", async ({ page }) => {
    await page.goto("/global/settings");
    await page.keyboard.press("ControlOrMeta+k");
    await expect(page.getByPlaceholder("Type a command or search")).toBeFocused();
    await shot(page, "command-menu");
    await page.keyboard.type("plug");
    await expect(page.getByText("Go to")).toBeVisible();
    await expect(page.getByText("Switch scope")).toHaveCount(0);
    await shot(page, "command-menu-query");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/global\/plugins$/);
  });

  test("shortcuts: ⌘n follows the visible items and ⌘⇧T flips the theme", async ({ page }) => {
    await page.goto("/global/settings");
    await page.keyboard.press("ControlOrMeta+9");
    await expect(page).toHaveURL(/\/global\/plugins$/);
    await page.goto(`${projectUrl("fetcher")}/settings`);
    await page.keyboard.press("ControlOrMeta+8");
    await expect(page).toHaveURL(/\/mcp$/);
    await page.keyboard.press("ControlOrMeta+Shift+t");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.keyboard.press("ControlOrMeta+Shift+t");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("offline banner", async ({ page }) => {
    await page.route("**/api/**", (route) => route.abort("connectionrefused"));
    await page.goto("/global/settings");
    await expect(page.getByText("cluide server is not running")).toBeVisible();
    await shot(page, "offline");
    await page.unroute("**/api/**");
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("cluide server is not running")).toHaveCount(0);
  });
});
