import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { homeDir, main, projectUrl, shot, toast } from "./helpers";

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
    // Rail mode drops the <nav> landmark, so a link missing from <nav> proves the collapse.
    await expect(page.locator("nav").getByRole("link", { name: "Settings" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
    await shot(page, "shell-collapsed");
    await page.reload();
    await expect(page.locator("nav").getByRole("link", { name: "Settings" })).toHaveCount(0); // persisted
    await page.getByRole("button", { name: "Toggle sidebar" }).click();
  });

  test("shell-scope-open", async ({ page }) => {
    await page.goto("/global/settings");
    await page
      .getByRole("button", { name: /Global/ })
      .first()
      .click();
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

  test("command-menu hint sits 8px after the label", async ({ page }) => {
    await page.goto("/global/settings");
    await page.keyboard.press("ControlOrMeta+k");
    const item = page.locator("[cmdk-item]").first();
    const label = item.locator("span").nth(1);
    const hint = item.locator("span.font-mono");
    const [labelBox, hintBox] = await Promise.all([label.boundingBox(), hint.boundingBox()]);
    expect(Math.round(hintBox!.x - (labelBox!.x + labelBox!.width))).toBe(8);
  });

  test("shortcuts: ⌘n follows the visible items and the theme flips from the menu", async ({ page }) => {
    await page.goto("/global/settings");
    await page.keyboard.press("ControlOrMeta+9");
    await expect(page).toHaveURL(/\/global\/plugins$/);
    await page.goto(`${projectUrl("fetcher")}/settings`);
    await page.keyboard.press("ControlOrMeta+8");
    await expect(page).toHaveURL(/\/mcp$/);
    await page.keyboard.press("ControlOrMeta+Shift+t"); // Chrome's reopen-closed-tab; the page must ignore it
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.keyboard.press("ControlOrMeta+k");
    await page.keyboard.type("Toggle theme");
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "Toggle theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("clickable controls show the pointer cursor", async ({ page }) => {
    await page.goto("/global/rules");
    const cursor = (locator: ReturnType<typeof page.locator>) => locator.evaluate((el) => getComputedStyle(el).cursor);
    await expect.poll(() => cursor(page.getByRole("button", { name: "security.md" }))).toBe("pointer");
    await expect.poll(() => cursor(page.getByRole("link", { name: /^Settings/ }))).toBe("pointer");
    await expect.poll(() => cursor(page.getByRole("button", { name: "Toggle theme" }))).toBe("pointer");
    await page.keyboard.press("ControlOrMeta+k");
    await expect.poll(() => cursor(page.getByRole("option", { name: /^Memory/ }))).toBe("pointer");
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
    const row = page.getByRole("button", { name: "style.md" });
    await expect(row).toHaveClass(/selected/);
    const bg = () => row.evaluate((el) => getComputedStyle(el).backgroundColor);
    const before = await bg();
    await row.hover();
    await expect.poll(bg).toBe(before);
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
    await expect(page.locator("textarea")).toBeFocused();
  });

  test("a failed read clears once retried", async ({ page }) => {
    await page.goto("/global/rules");
    // A boolean gate, not a counter: the reload may fire the GET more than once.
    let failing = true;
    await page.route("**/api/file?**", async (route) => {
      if (failing)
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ error: { code: "not_found", message: "gone" } }),
        });
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
    // security.md: no other case edits it, so the diff is exactly +1.
    await page.getByRole("button", { name: "security.md" }).click();
    const ta = page.locator("textarea");
    const before = await ta.inputValue();
    const after = before.endsWith("\n")
      ? `${before}Added by the render spec.\n`
      : `${before}\nAdded by the render spec.\n`;
    await ta.fill(after);
    await page.keyboard.press("ControlOrMeta+s");
    await page.getByRole("button", { name: "View diff" }).click();
    // Scope to the sheet: the still-mounted textarea shares the same text.
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("Added by the render spec.")).toBeVisible();
    await expect(sheet.getByText("+1", { exact: true })).toBeVisible();
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

  test("conflict dialog: Escape leaves the on-disk rewrite untouched", async ({ page }) => {
    await page.goto("/global/memory");
    const ta = page.locator("textarea");
    // fill() keeps the trailing newline, so later diffs in the suite stay pure additions.
    const before = await ta.inputValue();
    await ta.fill(before.endsWith("\n") ? `${before}mine\n` : `${before}\nmine\n`);
    const claudeMd = join(homeDir(), ".claude", "CLAUDE.md");
    writeFileSync(claudeMd, "# Escape leaves this alone\n");
    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByText("changed on disk")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText("changed on disk")).toHaveCount(0);
    await expect(page.getByText("Unsaved changes")).toBeVisible();
    expect(readFileSync(claudeMd, "utf8")).toBe("# Escape leaves this alone\n");
  });

  test("conflict dialog: Overwrite replaces the on-disk rewrite", async ({ page }) => {
    await page.goto("/global/memory");
    const ta = page.locator("textarea");
    const before = await ta.inputValue();
    const edited = before.endsWith("\n") ? `${before}mine\n` : `${before}\nmine\n`;
    await ta.fill(edited);
    const claudeMd = join(homeDir(), ".claude", "CLAUDE.md");
    writeFileSync(claudeMd, "# Overwrite replaces this\n");
    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByText("changed on disk")).toBeVisible();
    await page.getByRole("button", { name: "Overwrite" }).click();
    // ConflictDialog is still mounted (open or mid-exit-animation) when the toast lands, hiding it from getByRole.
    await expect(page.locator('[role="status"]')).toContainText("Saved");
    expect(readFileSync(claudeMd, "utf8")).toBe(edited);
  });

  test("a conflict with no version on disk recovers as a create", async ({ page }) => {
    await page.goto("/global/rules");
    await page.getByRole("button", { name: "testing.md" }).click();
    const ta = page.locator("textarea");
    await expect(ta).toHaveValue(/Assert whole payloads/);
    await ta.click();
    await ta.press("End");
    await ta.pressSequentially(" edited");
    unlinkSync(join(homeDir(), ".claude", "rules", "testing.md"));
    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByText("changed on disk")).toBeVisible();
    await page.keyboard.press("Enter");
    // Focus returns to the textarea only after the dialog's exit animation; wait for it to be gone.
    await expect(page.getByText("changed on disk")).toHaveCount(0);
    await expect(ta).toHaveValue("");
    await ta.fill("# Back");
    await page.keyboard.press("ControlOrMeta+s");
    // The dismissed conflict dialog is still mid-exit-animation when the toast lands, hiding it from getByRole.
    await expect(page.locator('[role="status"]')).toContainText("Saved");
    expect(existsSync(join(homeDir(), ".claude", "rules", "testing.md"))).toBe(true);
  });

  test("editor-delete", async ({ page }) => {
    await page.goto("/global/rules");
    // Its own file: no other case may depend on what editor-new or editor-delete create.
    await page.request.post("/api/file", {
      headers: { "X-Cluide": "1" },
      data: { path: `${homeDir()}/.claude/rules/to-delete.md`, content: "" },
    });
    await page.reload();
    await page.getByRole("button", { name: "to-delete.md" }).click();
    // exact: the just-clicked "to-delete.md" item also matches a "Delete" substring.
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText("Delete to-delete.md?")).toBeVisible();
    await shot(page, "editor-delete");
    await page.getByRole("button", { name: "Delete", exact: true }).last().click();
    await expect(page.getByText("Deleted to-delete.md")).toBeVisible();
    await expect(page.getByRole("button", { name: "to-delete.md" })).toHaveCount(0);
  });

  test("a failed delete keeps the dialog open", async ({ page }) => {
    await page.goto("/global/rules");
    await page.getByRole("button", { name: "security.md" }).click();
    await page.route("**/api/file?**", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({ error: { code: "conflict", message: "security.md changed on disk" } }),
        });
      } else {
        await route.continue();
      }
    });
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Delete security.md?")).toBeVisible();
    await page.getByRole("button", { name: "Delete", exact: true }).last().click();
    await expect(page.getByRole("dialog").getByText("Delete failed · 409 · security.md changed on disk")).toBeVisible();
    await expect(page.getByRole("alert")).toHaveText("Delete failed · 409 · security.md changed on disk");
    await expect(page.getByText("Delete security.md?")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "security.md" })).toBeVisible();
    // The error clears on reopen instead of lingering from the previous attempt.
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Delete security.md?")).toBeVisible();
    await expect(page.getByRole("dialog").getByText("Delete failed", { exact: false })).toHaveCount(0);
    await page.keyboard.press("Escape");
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

  test("settings-warnings", async ({ page }) => {
    await page.goto("/global/settings");
    await expect(page.locator("textarea")).toHaveValue(/"enabledPlugins"/);
    const warnings = page.getByRole("complementary", { name: "Warnings" });
    await expect(warnings.getByText("3", { exact: true })).toBeVisible();
    await expect(warnings.getByText("/hooks/PreToolUse/0/matcher")).toBeVisible();
    await expect(warnings.getByText("must be string")).toBeVisible();
    await expect(warnings.getByText("/modelSettings")).toBeVisible();
    await expect(warnings.getByText("/mcpServers")).toBeVisible();
    await expect(warnings.getByText("not a documented setting")).toHaveCount(2);
    await shot(page, "settings-warnings");
    const rows = warnings.getByRole("button");
    await rows.first().click();
    await expect(page.locator("textarea")).toBeFocused();
  });

  test("settings-local-missing", async ({ page }) => {
    await page.goto("/global/settings");
    await page.getByRole("button", { name: /settings\.local\.json/ }).click();
    await expect(page.getByText("settings.local.json does not exist in this scope")).toBeVisible();
    await shot(page, "settings-local-missing");
    await page.getByRole("button", { name: "Create settings.local.json" }).click();
    await expect(page.getByText("Unsaved changes")).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("settings-unparsable", async ({ page }) => {
    await page.goto(`${projectUrl("cluide")}/settings`);
    await page.getByRole("button", { name: /settings\.local\.json/ }).click();
    await expect(page.getByText("does not parse. Fix it and save.")).toBeVisible();
    await shot(page, "settings-unparsable");
    await page.locator("textarea").fill('{\n  "permissions": {\n    "allow": []\n  }\n}\n');
    await page.keyboard.press("ControlOrMeta+s");
    await expect(toast(page)).toContainText("Saved");
    await expect(page.getByText("does not parse. Fix it and save.")).toHaveCount(0);
  });

  test("settings: an invalid document shows the inline error", async ({ page }) => {
    await page.goto("/global/settings");
    const ta = page.locator("textarea");
    await ta.fill("[1]");
    await page.keyboard.press("ControlOrMeta+s");
    await expect(main(page).getByText("json must be an object")).toBeVisible();
    await expect(toast(page)).toContainText("Save failed");
    await page.keyboard.press("Escape");
  });

  test("hooks", async ({ page }) => {
    await page.goto("/global/hooks");
    await expect(page.getByText("PreToolUse")).toBeVisible();
    await expect(page.getByText("Scripts in hooks/")).toBeVisible();
    await shot(page, "hooks");
    await page
      .getByRole("link", { name: /validate-git-ops\.py/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/global\/hooks\/validate-git-ops\.py$/);
    await expect(page.getByText("Hooks / validate-git-ops.py")).toBeVisible();
    await expect(page.getByRole("button", { name: "New script" })).toBeVisible();
    await expect(page.locator("textarea")).toHaveValue(/python3/);
  });

  test("hooks-empty", async ({ page }) => {
    await page.goto(`${projectUrl("reporting-api")}/hooks`);
    await expect(page.getByText("No hooks in this scope")).toBeVisible();
    await shot(page, "hooks-empty");
  });

  test("mcp-global", async ({ page }) => {
    await page.goto("/global/mcp");
    await expect(page.getByText("corp-proxy")).toBeVisible();
    await expect(page.getByText(/precedence local/)).toBeVisible();
    await shot(page, "mcp-global");
  });

  test("mcp-project with approval, shadowing and the sheet", async ({ page }) => {
    await page.goto(`${projectUrl("fetcher")}/mcp`);
    await expect(page.getByText("Shadowed by local")).toBeVisible();
    await expect(page.getByRole("switch", { name: "Approve fetcher-postgres-local" })).toBeChecked();
    await shot(page, "mcp-project");
    await page.getByRole("switch", { name: "Approve fetcher-postgres-local" }).click();
    await expect(page.getByText("Approval removed for fetcher-postgres-local")).toBeVisible();
    await page.getByRole("switch", { name: "Approve fetcher-postgres-local" }).click();
    await expect(page.getByText("Approved fetcher-postgres-local")).toBeVisible();

    await page.getByRole("row", { name: /^asana/ }).click();
    await expect(page.getByRole("dialog")).toContainText("Config");
    await expect(page.getByRole("dialog").locator("textarea")).toBeFocused();
    // Linux lays the sheet out a fraction of a pixel wide, so compare rounded.
    expect(Math.round((await page.getByRole("dialog").boundingBox())?.width ?? 0)).toBe(520);
    await shot(page, "mcp-sheet");
    const ta = page.getByRole("dialog").locator("textarea");
    await ta.fill("not json");
    await page.keyboard.press("ControlOrMeta+s");
    await expect(page.getByRole("dialog").getByText("config must be valid JSON")).toBeVisible();
    await ta.fill('{\n  "type": "http",\n  "url": "https://mcp.asana.com/mcp",\n  "headers": {}\n}\n');
    await page.keyboard.press("ControlOrMeta+s");
    // The MCP sheet stays open on success and hides the toast from getByRole.
    await expect(page.locator('[role="status"]')).toContainText("Saved");
    await page.keyboard.press("Escape");

    await page.getByRole("row", { name: /^corp-proxy/ }).click();
    await expect(page.getByText("Managed by your organisation")).toBeVisible();
    await shot(page, "mcp-sheet-readonly");
    await page.keyboard.press("Escape");
  });

  test("mcp-approval failure keeps the switch checked and toasts", async ({ page }) => {
    await page.goto(`${projectUrl("fetcher")}/mcp`);
    await page.route("**/api/mcp/approval", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "internal", message: "backup failed" } }),
      }),
    );
    const sw = page.getByRole("switch", { name: "Approve fetcher-postgres-local" });
    await expect(sw).toBeChecked();
    await sw.click();
    await expect(toast(page)).toContainText("Save failed");
    await expect(toast(page)).toContainText("500 · backup failed");
    await expect(sw).toBeChecked();
  });

  test("mcp-add", async ({ page }) => {
    await page.goto(`${projectUrl("fetcher")}/mcp`);
    await page.getByRole("button", { name: "Add server" }).click();
    await expect(page.getByPlaceholder("my-server")).toBeFocused();
    await shot(page, "mcp-add");
    // A non-default target first, so the reopened dialog proves it reset to the scope's default.
    await page.getByRole("button", { name: /^Local/ }).click();
    await page.getByPlaceholder("my-server").fill("echo");
    await page.getByPlaceholder("npx").fill("echo");
    await page
      .getByRole("button", { name: /^Add server/ })
      .last()
      .click();
    await expect(page.getByText("Added echo")).toBeVisible();
    await expect(page.getByRole("row", { name: /^echo/ })).toBeVisible();
    await page.getByRole("row", { name: /^echo/ }).click();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).last().click();
    await expect(page.getByText("Deleted echo")).toBeVisible();

    await page.getByRole("button", { name: "Add server" }).click();
    await expect(page.getByRole("button", { name: /^Project/ })).toHaveClass(/bg-background/);
  });

  test("a failed add keeps the dialog open and shows the error inside it", async ({ page }) => {
    await page.route("**/api/mcp", (route) =>
      route.request().method() === "PUT"
        ? route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ error: { code: "internal", message: "backup failed" } }),
          })
        : route.continue(),
    );
    await page.goto(`${projectUrl("fetcher")}/mcp`);
    await page.getByRole("button", { name: "Add server" }).click();
    await page.getByPlaceholder("my-server").fill("echo");
    await page.getByPlaceholder("npx").fill("echo");
    await page.getByRole("dialog").getByRole("button", { name: "Add server" }).click();
    await expect(page.getByRole("dialog").getByText("Save failed · 500 · backup failed")).toBeVisible();
    await expect(page.getByRole("alert")).toHaveText("Save failed · 500 · backup failed");
  });

  test("mcp-project-1024", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(`${projectUrl("fetcher")}/mcp`);
    await expect(page.getByText("Shadowed by local")).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    ).toBe(true);
    await shot(page, "mcp-project-1024");
  });

  test("mcp-broken-source: a source that does not parse is listed, the rest still renders", async ({ page }) => {
    await page.route("**/api/mcp?*", async (route) => {
      const res = await route.fetch();
      const body = await res.json();
      body.errors = [{ file: "/tmp/plugin/.mcp.json", message: ".mcp.json is not valid JSON" }];
      await route.fulfill({ response: res, body: JSON.stringify(body) });
    });
    await page.goto(`${projectUrl("fetcher")}/mcp`);
    await expect(main(page).getByText("does not parse")).toBeVisible();
    await expect(main(page).getByText(".mcp.json is not valid JSON")).toBeVisible();
    await expect(main(page).getByRole("row").nth(1)).toBeVisible();
    await shot(page, "mcp-broken-source");
  });

  test("command menu's Add server opens the dialog", async ({ page }) => {
    await page.goto("/global/settings");
    await page.keyboard.press("ControlOrMeta+k");
    await page.keyboard.type("Add server");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/global\/mcp$/);
    await expect(page.getByPlaceholder("my-server")).toBeVisible();
  });

  test("plugins", async ({ page }) => {
    await page.route("**/api/plugins", async (route) => {
      if (route.request().method() === "GET") await new Promise((r) => setTimeout(r, 300));
      await route.continue();
    });
    await page.goto("/global/plugins");
    await expect(page.locator(".animate-pulse").first()).toBeVisible();
    expect(await page.getByText(/0 plugins/).count()).toBe(0);
    await expect(page.getByText("9 plugins · 6 enabled")).toBeVisible();
    await shot(page, "plugins");
    await page.getByRole("switch", { name: "Enable code-review" }).click();
    await expect(page.getByText("Enabled code-review")).toBeVisible();
    await expect(page.getByText("9 plugins · 7 enabled")).toBeVisible();
    await page.getByRole("switch", { name: "Enable code-review" }).click();
    await expect(page.getByText("Disabled code-review")).toBeVisible();
    await page.getByPlaceholder("Filter plugins").fill("acme");
    await expect(page.getByRole("row")).toHaveCount(2); // header + acme-mcp
    await expect(page.getByText("9 plugins · 6 enabled")).toBeVisible();
  });

  test("a failed plugin list read shows Retry", async ({ page }) => {
    // A boolean gate, not a one-shot counter — see "a failed read clears once retried" above.
    let failing = true;
    await page.route("**/api/plugins", async (route) => {
      if (failing) {
        await route.fulfill({
          status: 422,
          contentType: "application/json",
          body: JSON.stringify({
            error: { code: "unprocessable", message: "installed_plugins.json is not valid JSON" },
          }),
        });
      } else {
        await route.continue();
      }
    });
    await page.goto("/global/plugins");
    await expect(page.getByText("Plugins could not be loaded")).toBeVisible();
    await expect(page.getByText("422 · installed_plugins.json is not valid JSON")).toBeVisible();
    failing = false;
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText("acme-mcp")).toBeVisible();
  });
});

test.describe("light", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("cluide.theme", JSON.stringify("light")));
  });

  test("light-shell and light-settings-warnings", async ({ page }) => {
    await page.goto("/global/settings");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await shot(page, "light-settings-warnings");
    await shot(page, "light-shell");
  });

  test("light-editor-diff", async ({ page }) => {
    await page.goto("/global/rules");
    const ta = page.locator("textarea");
    await ta.click();
    await ta.press("End");
    await ta.pressSequentially("\nLight render line.");
    await page.keyboard.press("ControlOrMeta+s");
    await page.getByRole("button", { name: "View diff" }).click();
    // Scope to the sheet: the still-mounted textarea shares the same text.
    await expect(page.getByRole("dialog").getByText("Light render line.")).toBeVisible();
    await shot(page, "light-editor-diff");
  });

  test("light-mcp-project and light-plugins", async ({ page }) => {
    await page.goto(`${projectUrl("fetcher")}/mcp`);
    await expect(page.getByText("Shadowed by local")).toBeVisible();
    await shot(page, "light-mcp-project");
    await page.goto("/global/plugins");
    await expect(page.getByText(/plugins ·/)).toBeVisible();
    await shot(page, "light-plugins");
  });
});
