import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { homeDir, toast } from "./helpers";

test("edit the global memory file, save, see the diff", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Memory" }).click();
  const ta = page.locator("textarea");
  await expect(ta).toHaveValue(/# /);
  // A click + End + typed "\n..." lands after the file's trailing newline (every seeded memory
  // file ends in one), so it always adds an *empty* line plus the typed one — see editor-diff's
  // own comment on this. Append via fill instead, so exactly one line is added and +1 stays true.
  const before = await ta.inputValue();
  const after = before.endsWith("\n") ? `${before}- Smoke test line\n` : `${before}\n- Smoke test line\n`;
  await ta.fill(after);
  await page.getByRole("button", { name: /^Save/ }).click();
  await expect(toast(page)).toContainText("Saved");
  await page.getByRole("button", { name: "View diff" }).click();
  // Scope to the sheet: it sits over the still-mounted textarea, which shares the same text.
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("- Smoke test line")).toBeVisible();
  await expect(sheet.getByText("+1", { exact: true })).toBeVisible();
  expect(readFileSync(join(homeDir(), ".claude", "CLAUDE.md"), "utf8")).toContain("- Smoke test line");
});
