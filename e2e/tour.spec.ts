import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { expect, type Page, test } from "@playwright/test";
import { projectUrl } from "./helpers";

// Recorded for the README gif only; `bun run e2e` skips it. Run it with `bun run gif`.
test.skip(!process.env.GIF, "set GIF=1 (bun run gif)");

const SIZE = { width: 1024, height: 680 };
test.use({ viewport: SIZE, video: { mode: "on", size: SIZE } });

// Every frame is published, so nothing from this machine may reach one. The seeded demo home is
// the only home on screen; if a real path ever renders, the recording fails instead of shipping.
const PRIVATE = [homedir(), process.env.USER, process.env.TMPDIR].filter((s): s is string => !!s && s !== "/");

// A beat: hold a finished state long enough to read, and check it before the frames are kept.
async function beat(page: Page, ms = 1100) {
  const text = await page.locator("body").innerText();
  for (const secret of PRIVATE) expect(text, `the page shows ${secret}`).not.toContain(secret);
  await page.waitForTimeout(ms);
}

// Playwright's video has no mouse cursor, so the tour drives the app the way the app asks to be
// driven: ⌘K, ⌘1…⌘9, ⌘S.
test("tour", async ({ page }) => {
  await page.goto("/global/settings");
  await expect(page.getByRole("complementary", { name: "Warnings" }).getByText("/modelSettings")).toBeVisible();
  await beat(page, 1300);

  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.getByPlaceholder("Type a command or search")).toBeFocused();
  await beat(page, 500);
  await page.keyboard.type("plug", { delay: 90 });
  await beat(page, 500);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/global\/plugins$/);
  await beat(page, 900);

  await page.getByRole("switch", { name: "Enable code-review" }).click();
  await expect(page.getByText("Enabled code-review")).toBeVisible();
  await beat(page, 1100);

  // MCP servers is the one screen with no digit of its own, so the menu takes us there.
  await page.keyboard.press("ControlOrMeta+k");
  await page.keyboard.type("mcp", { delay: 90 });
  await beat(page, 500);
  await page.keyboard.press("Enter");
  await expect(page.getByText(/precedence local/)).toBeVisible();
  await beat(page, 1200);

  // The scope switcher keeps the screen and changes the files under it.
  await page
    .getByRole("button", { name: /Global/ })
    .first()
    .click();
  await expect(page.getByPlaceholder("Switch scope")).toBeFocused();
  await beat(page, 500);
  await page.keyboard.type("acme", { delay: 90 });
  await beat(page, 500);
  await page.getByText("acme-api", { exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${projectUrl("acme-api")}/mcp$`));
  await beat(page, 1300);

  await page.keyboard.press("ControlOrMeta+3");
  await page.getByRole("button", { name: "api.md" }).click();
  const editor = page.locator("textarea");
  await editor.click();
  await editor.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(el.value.length, el.value.length));
  await beat(page, 400);
  await page.keyboard.type("No secrets in logs.\n", { delay: 45 });
  await expect(page.getByText("Unsaved changes")).toBeVisible();
  await beat(page, 500);

  await page.keyboard.press("ControlOrMeta+s");
  await page.getByRole("button", { name: "View diff" }).click();
  const diff = page.getByRole("dialog");
  await expect(diff.getByText("No secrets in logs.")).toBeVisible();
  await expect(diff.getByText("+1", { exact: true })).toBeVisible();
  await beat(page, 1600);
  await page.keyboard.press("Escape");
  await beat(page, 600);

  await page.close();
  await page.video()?.saveAs(fileURLToPath(new URL("./test-results/tour.webm", import.meta.url)));
});
