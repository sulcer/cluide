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
    // Rail mode drops the <nav> landmark (the group labels move into it); the rail's own
    // icon-only links carry the same accessible name, so scope to <nav> to detect collapse.
    await expect(page.locator("nav").getByRole("link", { name: "Settings" })).toHaveCount(0);
    await shot(page, "shell-collapsed");
    await page.reload();
    await expect(page.locator("nav").getByRole("link", { name: "Settings" })).toHaveCount(0); // persisted
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

  test("editor-clean and editor-dirty", async ({ page }) => {
    await page.goto("/global/memory");
    const ta = page.locator("textarea");
    await expect(ta).toHaveValue(/# Global instructions/);
    await expect(main(page).getByText("Saved")).toBeVisible();
    await shot(page, "editor-clean");
    await ta.click();
    await ta.press("End");
    await ta.pressSequentially(" edited");
    await expect(page.getByText("Unsaved changes")).toBeVisible();
    await shot(page, "editor-dirty");
    await page.keyboard.press("Escape");
    await expect(main(page).getByText("Saved")).toBeVisible();
    await expect(ta).not.toHaveValue(/edited/);
  });

  test("editor-saving", async ({ page }) => {
    await page.route("**/api/file", async (route) => {
      if (route.request().method() === "PUT") await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.goto("/global/rules");
    const ta = page.locator("textarea");
    await ta.click();
    await ta.press("End");
    await ta.pressSequentially("\nOne more rule.");
    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByRole("button", { name: /^Save/ })).toBeDisabled();
    await shot(page, "editor-saving");
    await expect(main(page).getByText("Saved", { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test("editor-skills shows the frontmatter row", async ({ page }) => {
    await page.goto("/global/skills");
    await expect(page.getByText("frontmatter")).toBeVisible();
    await expect(page.getByText("brainstorming", { exact: true })).toBeVisible();
    await shot(page, "editor-skills");
  });

  test("editor-empty", async ({ page }) => {
    await page.goto(`${projectUrl("reporting-api")}/rules`);
    await expect(page.getByText("No rules in this scope")).toBeVisible();
    await shot(page, "editor-empty");
  });

  test("editor-new creates a file", async ({ page }) => {
    await page.goto("/global/rules");
    await page.getByRole("button", { name: "New rule" }).click();
    await expect(page.getByPlaceholder("name")).toBeFocused();
    await shot(page, "editor-new");
    await page.keyboard.type("style");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Created style.md")).toBeVisible();
    await expect(page.getByRole("button", { name: "style.md" })).toHaveClass(/selected/);
  });

  test("editor-create for a missing fixed file", async ({ page }) => {
    await page.goto(`${projectUrl("reporting-api")}/memory`);
    await page.getByRole("button", { name: "CLAUDE.local.md" }).click();
    await expect(page.getByText("CLAUDE.local.md does not exist in this scope")).toBeVisible();
    await shot(page, "editor-create");
    await page.getByRole("button", { name: "Create CLAUDE.local.md" }).click();
    await expect(page.locator("textarea")).toHaveValue("# reporting-api\n\n");
    await expect(page.getByText("Unsaved changes")).toBeVisible();
    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByText("Created CLAUDE.local.md")).toBeVisible();
  });

  test("j and k move the selection", async ({ page }) => {
    await page.goto("/global/rules");
    await page.locator("main").click({ position: { x: 120, y: 700 } }); // the list column, below its items
    await page.keyboard.press("j");
    await expect(page.getByRole("button", { name: "security.md" })).toHaveClass(/selected/);
    await page.keyboard.press("k");
    await expect(page.getByRole("button", { name: "git-workflow.md" })).toHaveClass(/selected/);
  });
});
