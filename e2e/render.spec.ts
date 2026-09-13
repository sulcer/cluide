import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { homeDir, main, projectUrl, shot } from "./helpers";

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
    await expect(page.locator("textarea")).not.toBeFocused();
    await page.keyboard.press("k");
    await expect(page.getByRole("button", { name: "git-workflow.md" })).toHaveClass(/selected/);
  });

  test("reopening a recent file of the same kind", async ({ page }) => {
    await page.goto("/global/rules");
    await page.getByRole("button", { name: "security.md" }).click();
    await page.getByRole("button", { name: "testing.md" }).click();
    await page.keyboard.press("ControlOrMeta+k");
    await page.keyboard.type("security");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "security.md" })).toHaveClass(/selected/);
    await expect(page.locator("textarea")).toHaveValue(/Never paste raw logs into chat/);
  });

  test("a failed read clears once retried", async ({ page }) => {
    await page.goto("/global/rules");
    // A boolean gate, not a one-shot counter: the reload can fire the file GET more than once in
    // quick succession, and a counter races on which request lands "first". Fulfilling 404 for
    // every request while failing is true is idempotent regardless of how many fire.
    let failing = true;
    await page.route("**/api/file?**", async (route) => {
      if (failing) await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_found", message: "gone" } }) });
      else await route.continue();
    });
    await page.reload();
    await expect(page.getByText("git-workflow.md could not be read")).toBeVisible();
    failing = false;
    await page.evaluate(() => window.dispatchEvent(new Event("cluide:retry")));
    await expect(page.locator("textarea")).toBeVisible();
    await expect(page.getByText("could not be read")).toHaveCount(0);
  });

  test("editor-diff", async ({ page }) => {
    await page.goto("/global/rules");
    const ta = page.locator("textarea");
    await ta.click();
    await ta.press("End");
    await ta.pressSequentially("\nAdded by the render spec.");
    await page.keyboard.press("ControlOrMeta+s");
    await page.getByRole("button", { name: "View diff" }).click();
    // The sheet sits over the still-mounted textarea, which shares the same edited text; scope to
    // the sheet (a Radix Dialog, role="dialog") so the match is unambiguous.
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Added by the render spec.")).toBeVisible();
    // The click lands after the file's trailing newline, so the appended text starts its own new
    // line: always 2 added lines, not 1. In the full suite (not run in isolation), "editor-saving"
    // above already strips git-workflow.md's trailing newline, so this also rewrites that
    // no-newline last line, making it +2 -1 rather than +2 -0 — either way, +2.
    await expect(sheet.getByText("+2", { exact: true })).toBeVisible();
    await shot(page, "editor-diff");
    await page.keyboard.press("Escape");
    await expect(page.getByText("Diff ·")).toHaveCount(0);
  });

  test("editor-conflict", async ({ page }) => {
    await page.goto("/global/memory");
    const ta = page.locator("textarea");
    await ta.click();
    await ta.press("End");
    await ta.pressSequentially(" mine");
    writeFileSync(join(homeDir(), ".claude", "CLAUDE.md"), "# Changed outside\n");
    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByText("changed on disk")).toBeVisible();
    await expect(page.getByText("Unsaved changes")).toBeVisible();
    await shot(page, "editor-conflict");
    await page.keyboard.press("Enter");
    await expect(ta).toHaveValue("# Changed outside\n");
    await expect(page.getByText("Reloaded CLAUDE.md from disk")).toBeVisible();
  });

  test("editor-delete", async ({ page }) => {
    await page.goto("/global/rules");
    await page.getByRole("button", { name: "style.md" }).click();
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Delete style.md?")).toBeVisible();
    await shot(page, "editor-delete");
    await page.getByRole("button", { name: "Delete", exact: true }).last().click();
    await expect(page.getByText("Deleted style.md")).toBeVisible();
    await expect(page.getByRole("button", { name: "style.md" })).toHaveCount(0);
  });

  test("esc: an open layer takes Esc before the editor", async ({ page }) => {
    await page.goto("/global/memory");
    const ta = page.locator("textarea");
    await ta.click();
    await ta.press("End");
    await ta.pressSequentially(" edited");
    await expect(page.getByText("Unsaved changes")).toBeVisible();
    await page.keyboard.press("ControlOrMeta+k");
    await page.keyboard.press("Escape");
    await expect(page.getByPlaceholder("Type a command or search")).toHaveCount(0);
    await expect(page.getByText("Unsaved changes")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(main(page).getByText("Saved")).toBeVisible();
  });
});
