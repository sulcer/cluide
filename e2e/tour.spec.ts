import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { projectUrl } from "./helpers";

// Recorded for the README gif only; `bun run e2e` skips it. Run it with `bun run gif`.
test.skip(!process.env.GIF, "set GIF=1 (bun run gif)");

// Recorded at two device pixels per CSS pixel: a 1x recording is drawn twice as large on the
// retina display it is read on, which softens every glyph. gifski scales it back down.
// `deviceScaleFactor` alone only pads the video canvas; the launch argument is what makes the
// capture itself twice as dense.
const SIZE = { width: 1024, height: 680 };
test.use({
  viewport: SIZE,
  deviceScaleFactor: 2,
  launchOptions: { args: ["--force-device-scale-factor=2"] },
  video: { mode: "on", size: { width: SIZE.width * 2, height: SIZE.height * 2 } },
});

declare global {
  interface Window {
    tourCue: (label: string) => void;
    tourPointTo: (x: number, y: number) => void;
    tourPress: () => void;
  }
}

// Every frame is published, so nothing from this machine may reach one. The seeded demo home is
// the only home on screen; if a real path ever renders, the recording fails instead of shipping.
const PRIVATE = [homedir(), process.env.USER, process.env.TMPDIR].filter((s): s is string => !!s && s !== "/");

// A beat: hold a finished state long enough to read, and check it before the frames are kept.
async function beat(page: Page, ms = 500) {
  const text = await page.locator("body").innerText();
  for (const secret of PRIVATE) expect(text, `the page shows ${secret}`).not.toContain(secret);
  await page.waitForTimeout(ms);
}

// The video has no cursor and no key overlay, so screens would otherwise change for no visible
// reason. Both live outside the app's root, where React never touches them.
async function installOverlay(page: Page) {
  await page.addInitScript(() => {
    const paint = () => {
      const cue = document.createElement("div");
      cue.style.cssText = `position:fixed;left:50%;bottom:26px;z-index:2147483647;transform:translateX(-50%);
        padding:9px 18px;border-radius:11px;background:rgba(44,44,50,.97);color:#fafafa;opacity:0;
        border:1px solid rgba(255,255,255,.22);
        font:600 21px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.03em;
        box-shadow:0 10px 30px rgba(0,0,0,.55);transition:opacity .16s;pointer-events:none`;
      const dot = document.createElement("div");
      dot.style.cssText = `position:fixed;left:0;top:0;width:19px;height:19px;border-radius:50%;
        background:rgba(255,255,255,.94);border:1.5px solid rgba(0,0,0,.5);z-index:2147483646;opacity:0;
        box-shadow:0 2px 9px rgba(0,0,0,.45);transform:translate(-60px,-60px);pointer-events:none;
        transition:transform .4s cubic-bezier(.22,.61,.36,1),opacity .2s`;
      document.body.append(cue, dot);

      let at = { x: -60, y: -60 };
      let timer: ReturnType<typeof setTimeout>;
      const place = (scale: number) => {
        dot.style.transform = `translate(${at.x - 9}px,${at.y - 9}px) scale(${scale})`;
      };
      window.tourCue = (label) => {
        cue.textContent = label;
        cue.style.opacity = "1";
        clearTimeout(timer);
        timer = setTimeout(() => {
          cue.style.opacity = "0";
        }, 950);
      };
      window.tourPointTo = (x, y) => {
        at = { x, y };
        dot.style.opacity = "1";
        place(1);
      };
      window.tourPress = () => {
        place(0.7);
        setTimeout(() => place(1), 150);
      };
    };
    if (document.body) paint();
    else document.addEventListener("DOMContentLoaded", paint);
  });
}

// A keystroke, announced: this is a keyboard tour, so the shortcut belongs in the picture.
async function press(page: Page, combo: string, label: string) {
  await page.evaluate((l) => window.tourCue(l), label);
  await page.keyboard.press(combo);
}

// A click, with the pointer travelling to the target first so the change has a visible cause.
async function click(page: Page, target: Locator) {
  const box = await target.boundingBox();
  if (box) {
    await page.evaluate(([x, y]) => window.tourPointTo(x, y), [box.x + box.width / 2, box.y + box.height / 2]);
    await page.waitForTimeout(340);
    await page.evaluate(() => window.tourPress());
    await page.waitForTimeout(110);
  }
  await target.click();
}

test("tour", async ({ page }) => {
  await installOverlay(page);
  await page.goto("/global/settings");
  await expect(page.getByRole("complementary", { name: "Warnings" }).getByText("/modelSettings")).toBeVisible();
  await beat(page, 1100);

  await press(page, "ControlOrMeta+2", "⌘2");
  await expect(page.locator("textarea")).toHaveValue(/# Global instructions/);
  await beat(page);

  await press(page, "ControlOrMeta+3", "⌘3");
  await expect(page.getByRole("button", { name: "security.md" })).toBeVisible();
  await beat(page);

  await press(page, "ControlOrMeta+4", "⌘4");
  await expect(page.getByRole("button", { name: "keybindings.json" })).toBeVisible();
  await beat(page, 480);

  await press(page, "ControlOrMeta+5", "⌘5");
  await expect(page.getByRole("button", { name: "reviewer.md" })).toBeVisible();
  await beat(page);

  await press(page, "ControlOrMeta+6", "⌘6");
  await expect(page.getByText("brainstorming", { exact: true })).toBeVisible();
  await beat(page);

  await press(page, "ControlOrMeta+7", "⌘7");
  await expect(page.getByRole("button", { name: "commit.md" })).toBeVisible();
  await beat(page, 480);

  await press(page, "ControlOrMeta+8", "⌘8");
  await expect(page.getByText("PreToolUse")).toBeVisible();
  await beat(page, 750);

  await press(page, "ControlOrMeta+9", "⌘9");
  await expect(page.getByRole("switch", { name: "Enable code-review" })).toBeVisible();
  await beat(page, 700);
  await click(page, page.getByRole("switch", { name: "Enable code-review" }));
  await expect(page.getByText("Enabled code-review")).toBeVisible();
  await beat(page, 850);

  // MCP servers is the one screen with no digit of its own, so the menu takes us there.
  await press(page, "ControlOrMeta+k", "⌘K");
  await page.keyboard.type("mcp", { delay: 70 });
  await beat(page, 450);
  await page.keyboard.press("Enter");
  await expect(page.getByText(/precedence local/)).toBeVisible();
  await beat(page, 1000);

  // The scope switcher keeps the screen and changes the files under it.
  await click(page, page.getByRole("button", { name: /Global/ }).first());
  await expect(page.getByPlaceholder("Switch scope")).toBeFocused();
  await beat(page, 400);
  await page.keyboard.type("acme", { delay: 70 });
  await beat(page, 400);
  await click(page, page.getByText("acme-api", { exact: true }));
  await expect(page).toHaveURL(new RegExp(`${projectUrl("acme-api")}/mcp$`));
  await beat(page, 1000);

  await press(page, "ControlOrMeta+3", "⌘3");
  await click(page, page.getByRole("button", { name: "api.md" }));
  const editor = page.locator("textarea");
  await editor.evaluate((el: HTMLTextAreaElement) => {
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  });
  await beat(page, 350);
  await page.keyboard.type("No secrets in logs.\n", { delay: 45 });
  await expect(page.getByText("Unsaved changes")).toBeVisible();
  await beat(page, 450);

  await press(page, "ControlOrMeta+s", "⌘S");
  await click(page, page.getByRole("button", { name: "View diff" }));
  const diff = page.getByRole("dialog");
  await expect(diff.getByText("No secrets in logs.")).toBeVisible();
  await expect(diff.getByText("+1", { exact: true })).toBeVisible();
  await beat(page, 1150);
  await press(page, "Escape", "Esc");
  await beat(page, 450);

  await click(page, page.getByRole("button", { name: "Toggle theme" }));
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await beat(page, 1100);

  await page.close();
  await page.video()?.saveAs(fileURLToPath(new URL("./test-results/tour.webm", import.meta.url)));
});
