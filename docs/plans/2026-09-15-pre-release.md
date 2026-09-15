# Pre-release Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the page to the palette it follows (one indigo accent on warm neutral grays), and fix the behaviours a stranger's machine will hit before the repository goes public: a broken MCP source file no longer hides the rest, dialogs show their own errors, drift against the Stable specs is closed, and the README shows the page.

**Architecture:** The token pass changes values in `src/globals.css` and three control rules; the shadcn variable set stays, so components pick the colours up unchanged. `GET /api/mcp` gains the `{ entries, errors }` envelope the settings resource already uses for partial reads. The delete and add-server dialogs render their failure inline. Everything else is a one-place fix against the spec sentence that names it.

**Tech Stack:** Bun server, React 19 page with Tailwind v4 (`@theme inline` reads the CSS variables), Playwright render suite (`bun run e2e`; `bun run render` writes screenshots to `e2e/renders/`), biome (`bun run lint` must be silent; `bun run format` before reading a diff).

**Spec:** `docs/spec/ui/tokens.md` (Theme variables, Controls), `docs/spec/ui/settings.md` (count badge), `docs/spec/api/mcp.md` (endpoints, shapes), `docs/spec/ui/mcp.md` (table banner, add dialog), `docs/spec/ui/editing.md` (delete dialog), `docs/spec/ui/shell.md` (command menu), with the ADR `docs/adr/2026-09-15-pre-release-refinements.md`. The changed specs are `Stable · Partial` with the new sentences marked *Planned* or carried by the note under At a glance; the last task flips them.

## Global Constraints

- Every gate green before a commit: `bun run typecheck && bun run lint && bun run test && bun run check-docs`; `bun run e2e` once per task before its commit.
- Values are copied from the spec tables verbatim; a value the spec does not give is not invented.
- Test payloads are asserted whole (`toEqual` on the full object), not field by field.
- No new dependency. No exclamation marks in prose. No other project's or company's name in the tree; the ADR's reference to the design it follows is the one exception already written.
- Git: Conventional Commits without scope, the `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>` trailer via HEREDOC, one commit per task, `git add` of named paths only; never stage `.agents/`, `.claude/skills/`, `skills-lock.json`, `.superpowers/`, `e2e/renders/`.
- Plan discipline: this file is deleted in the last task after anything durable moved to a spec or `nice-to-have.md`.

## File structure

```
src/globals.css                      theme values from tokens.md; .selected rule removed      [modify]
src/components/Button.tsx            secondary: no border, hover one step lighter            [modify]
src/components/Badge.tsx             count badge neutral                                     [modify]
server/resources/mcp.ts              listMcp returns McpList; per-source readJsonDoc        [modify]
server/tests/resources/mcp.test.ts   a broken plugin file: entries from the rest + one error [modify]
shared/api.ts                        McpSourceError, McpList                                 [modify]
src/screens/McpScreen.tsx            useResource<McpList>; error banner above the table      [modify]
src/editor/DeleteDialog.tsx          inline error instead of a toast                         [modify]
src/screens/McpAddDialog.tsx         inline error instead of a toast                         [modify]
src/screens/PluginsScreen.tsx        summary inside the loaded branch                        [modify]
src/shell/CommandMenu.tsx            hint 8px after the label                                [modify]
src/tsconfig.json                    types without bun                                       [modify]
e2e/helpers.ts                       toastUnderModal removed                                 [modify]
e2e/render.spec.ts                   new and changed cases per task                          [modify]
docs/readme/settings.png             a committed render for the README                       [create]
README.md                            screenshot and a short tour                             [modify]
docs/nice-to-have.md                 entries closed by this plan removed                     [modify]
```

---

### Task 1: The token pass

**Files:**
- Modify: `src/globals.css`, `src/components/Button.tsx`, `src/components/Badge.tsx`

- [ ] **Step 1: Renders before**

`bun run render`, then copy `e2e/renders/` to a scratch directory outside the repository (for example `$(mktemp -d)/before`). These are the before images for the review; they are never committed.

- [ ] **Step 2: Theme values**

`src/globals.css` has two blocks, `:root, [data-theme="dark"]` and `[data-theme="light"]`. For every variable in the Theme variables table of `docs/spec/ui/tokens.md`, set the dark block's value to the table's Dark column and the light block's value to its Light column, character for character. The table is the source; do not round, reorder or add variables. `--radius` and `--shadow` keep their values (the table does not change them). Check afterwards with a script that parses the table and the two CSS blocks and prints any variable whose values differ; it must print nothing. Keep that check out of the repository.

- [ ] **Step 3: Controls**

From the Controls table of `tokens.md`:

- `src/components/Button.tsx`, the `secondary` variant: `"bg-secondary hover:bg-accent dark:hover:bg-[oklch(0.3_0.002_60)]"`. No `border`. The `xs` size keeps its own `border` (the spec's secondary row is about the variant; the two `xs` buttons are the offline banner's `Retry` and the sidebar's `⌘K`).
- `src/components/Badge.tsx`, `CountBadge`: `count > 0 ? "bg-secondary text-foreground" : "bg-muted text-muted-foreground"`.
- `src/globals.css`, `@layer base`: delete the `.selected { box-shadow: inset 2px 0 0 var(--foreground); }` rule. The `selected` class stays on the three elements that carry it (`FileList`, `Sidebar`, `McpScreen`): the render suite asserts it with `toHaveClass(/selected/)`, and each of them already sets its background.

The switch needs no change: its track is `data-checked:bg-primary`, so it turns indigo with `--primary`.

- [ ] **Step 4: Renders after and gates**

`bun run format`, the four gates, `bun run e2e` green (41 cases). `bun run render` again and copy `e2e/renders/` to the same scratch directory as `after`. In the report, name the scratch directory and list five pairs worth looking at: `plugins`, `settings-warnings`, `editor-delete`, `mcp-project`, `light-shell`.

- [ ] **Step 5: Commit**

```
feat: give the page one indigo accent on warm neutral grays
```

---

### Task 2: List MCP servers past a broken file

**Files:**
- Modify: `shared/api.ts`, `server/resources/mcp.ts`, `server/tests/resources/mcp.test.ts`, `src/screens/McpScreen.tsx`, `e2e/render.spec.ts`

**Interfaces:**
- Produces: `listMcp(scope): McpList` where `McpList = { entries: McpEntry[]; errors: McpSourceError[] }` and `McpSourceError = { file: string; message: string }`. `GET /api/mcp` returns it.

- [ ] **Step 1: The failing unit test**

Append to `server/tests/resources/mcp.test.ts`, inside the existing `describe`, using the same temp-home helper and plugin seeding the file's `plugin_` prefix case uses (read the top of the file for both):

```ts
test("a plugin .mcp.json that does not parse is listed as an error, the rest still comes back", () => {
  // Seed exactly as the plugin-prefix case does, then break the plugin file.
  writeFileSync(pluginMcpJson, "{broken");
  expect(listMcp(scope)).toEqual({
    entries: entriesWithoutThePlugin,
    errors: [{ file: pluginMcpJson, message: ".mcp.json is not valid JSON" }],
  });
});
```

`pluginMcpJson`, `scope` and `entriesWithoutThePlugin` are the fixture's own values: the path of the seeded plugin's `.mcp.json`, the scope the neighbouring cases list, and the full `McpEntry[]` the same seed yields when the plugin contributes nothing. Every existing `listMcp(...)` assertion in the file changes from the array to `.entries`, or to the whole envelope with `errors: []`.

Run: `bun test server/tests/resources/mcp.test.ts` → FAIL.

- [ ] **Step 2: Shapes**

`shared/api.ts`, after `McpEntry`:

```ts
export interface McpSourceError {
  file: string;
  message: string;
}

export interface McpList {
  entries: McpEntry[];
  errors: McpSourceError[];
}
```

- [ ] **Step 3: `listMcp`**

`server/resources/mcp.ts`: import `readJsonDoc` next to `readJsonOrEmpty` (the write paths keep `readJsonOrEmpty` and their `422`), and add:

```ts
// A source that exists but does not parse is skipped and reported; the rest of the list still loads.
function readSource(path: string, errors: McpSourceError[]): Record<string, any> {
  const doc = readJsonDoc(path);
  if (doc.exists && doc.json === null) {
    errors.push({ file: path, message: `${basename(path)} is not valid JSON` });
    return {};
  }
  return doc.json ?? {};
}
```

`listMcp` declares `const errors: McpSourceError[] = [];` first, reads `~/.claude.json`, the project `.mcp.json`, each plugin file and `settings.json` through `readSource(path, errors)`, and returns `{ entries, errors }` typed `McpList`. `~/.claude.json` is read once, as today; if it is the broken file, the local and user sources are both empty and the one error names it. Adjust the route in `server/app.ts` only if it names the old type.

Run: `bun test server/tests/resources/mcp.test.ts` → PASS.

- [ ] **Step 4: The screen**

`src/screens/McpScreen.tsx`: `useResource<McpList>`; `const entries = list.data?.entries;` and `const errors = list.data?.errors ?? [];`. In `approve`, `list.setData((prev) => prev && { ...prev, entries: prev.entries.map((e) => (e === entry ? { ...e, enabled } : e)) })`. Inside the loaded branch, before the `<table>`, one line per error in the shape of the settings screen's `raw` banner (`src/screens/SettingsScreen.tsx`), per `ui/mcp.md`:

```tsx
{errors.map((err) => (
  <div
    key={err.file}
    className="mx-4 mt-3 flex items-center gap-2 rounded-md border border-destructive px-2.5 py-1.5 text-xs text-destructive"
  >
    <CircleAlert className="size-4 shrink-0" />
    <span className="font-mono">{err.file.split("/").pop()}</span>
    <span>does not parse</span>
    <div className="flex-1" />
    <span className="font-mono opacity-80">{err.message}</span>
  </div>
))}
```

If `src/lib/` already has a basename helper, use it instead of the inline `split`.

- [ ] **Step 5: The render case**

`e2e/render.spec.ts`, next to the `mcp-*` cases, a partial success over the real response:

```ts
test("mcp-broken-source: a source that does not parse is listed, the rest still renders", async ({ page }) => {
  await page.route("**/api/mcp?*", async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    body.errors = [{ file: "/tmp/plugin/.mcp.json", message: ".mcp.json is not valid JSON" }];
    await route.fulfill({ response: res, body: JSON.stringify(body) });
  });
  await page.goto(/* the URL the mcp-project case opens */);
  await expect(main(page).getByText("does not parse")).toBeVisible();
  await expect(main(page).getByText(".mcp.json is not valid JSON")).toBeVisible();
  await expect(main(page).getByRole("row").nth(1)).toBeVisible();
  await shot(page, "mcp-broken-source");
});
```

Use the navigation the neighbouring `mcp-project` case uses. Any other e2e mock that returns an array for `/api/mcp` returns `{ entries, errors: [] }`.

- [ ] **Step 6: Gates and commit**

`bun run format`, gates, `bun run e2e` green (42 cases).

```
feat: list mcp servers past a source file that does not parse
```

---

### Task 3: Errors inside the dialog that stays open

**Files:**
- Modify: `src/editor/DeleteDialog.tsx`, `src/screens/McpAddDialog.tsx`, `e2e/helpers.ts`, `e2e/render.spec.ts`

- [ ] **Step 1: The render cases first**

The existing case `a failed delete keeps the dialog open` asserts the error toast through `toastUnderModal`. Change it to assert the inline line inside the dialog, `Delete failed · <status> · <message>` with the status and message its mock returns, and add:

```ts
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
  // open the MCP screen the way the mcp-add case does, open Add server, fill name and command
  await page.getByRole("dialog").getByRole("button", { name: "Add server" }).click();
  await expect(page.getByRole("dialog").getByText("Save failed · 500 · backup failed")).toBeVisible();
});
```

Run both: FAIL.

- [ ] **Step 2: The dialogs**

`src/editor/DeleteDialog.tsx`: `const [error, setError] = useState<string>();`, reset to `undefined` whenever `open` becomes true. The `catch` sets `Delete failed · ${err.status ? `${err.status} · ` : ""}${err.message}` instead of calling `toast`; under `DialogDescription`, `{error && <div className="mt-2 text-xs text-destructive">{error}</div>}`. Drop the `toast` import. `src/screens/McpAddDialog.tsx`: the same, `Save failed · …`, rendered under the fields above the footer; the success toast stays. `e2e/helpers.ts`: remove `toastUnderModal` and its comment, and the comment in `render.spec.ts` that explained it.

- [ ] **Step 3: Gates and commit**

`bun run format`, gates, `bun run e2e` green (43 cases).

```
fix: show a failed action inside the dialog that stays open
```

---

### Task 4: Drift against the specs

**Files:**
- Modify: `src/screens/PluginsScreen.tsx`, `src/shell/CommandMenu.tsx`, `src/tsconfig.json`, `e2e/render.spec.ts`, and `src/lib/json.ts` with `src/tests/lib/json.test.ts` only if Step 4 finds a gap

- [ ] **Step 1: The plugins summary**

Move the `{n} plugins · {m} enabled` span into the `plugins !== undefined` branch, the way `McpScreen` shows its summary only once `entries` exist. In the plugins render case, delay `/api/plugins` by 300ms with a route and assert `0 plugins` is not visible while the skeleton shows, before the existing assertions.

- [ ] **Step 2: The command-menu hint**

`src/shell/CommandMenu.tsx`, `Item`: the row keeps `gap-2.5` (10px between items' parts, per `shell.md`); the hint span gets `-ml-0.5`, so it sits 8px after the label as the same sentence says. A render case opens the command menu and asserts `Math.round(hint.left - label.right) === 8` from the two spans' bounding boxes on an item that has a hint.

- [ ] **Step 3: `bun` out of the page's types**

`src/tsconfig.json`: `"types": ["vite/client"]`. Nothing under `src/` or `shared/` uses a Bun global, so `bun run typecheck` stays green.

- [ ] **Step 4: The JSON error message**

Open the settings screen with the unparsable file (the existing `settings-unparsable` case) and read the banner's message in Chrome. If it names a line and column, the `nice-to-have.md` entry is stale and the last task deletes it. If not, extend `describeJsonError` in `src/lib/json.ts` to turn `at position N` into `line L, column C` computed from the text, with a unit test asserting the full returned string.

- [ ] **Step 5: Gates and commit**

`bun run format`, gates, `bun run e2e` green (44 cases).

```
fix: close the drift against the ui specs
```

---

### Task 5: README, deferred list and the docs flip

**Files:**
- Create: `docs/readme/settings.png`
- Modify: `README.md`, `docs/nice-to-have.md`, `docs/spec/ui/tokens.md`, `docs/spec/ui/settings.md`, `docs/spec/api/mcp.md`, `docs/spec/ui/mcp.md`, `docs/spec/ui/editing.md`
- Delete: `docs/plans/2026-09-15-pre-release.md`

- [ ] **Step 1: The README**

`bun run render`, copy `e2e/renders/settings-warnings.png` to `docs/readme/settings.png`. Under the opening paragraph of `README.md`:

```markdown
![The settings screen with schema warnings, the sidebar and the editor](docs/readme/settings.png)

## Screens

- **Settings** with the SchemaStore warnings beside the file, for the user, project and local files.
- **Memory, rules, agents, skills and commands** as plain files, with a diff after every save.
- **Hooks** grouped by event, with the scripts they call.
- **MCP servers** merged across every scope, with what shadows what and project approval.
- **Plugins** with their marketplace, version and an enable switch.

Every screen shares one editor: `⌘S` saves, a conflict shows both versions, `⌘K` finds anything.
```

The rest of the file stays. `docs/readme/` is outside `files`, so the package does not ship it.

- [ ] **Step 2: The deferred list**

`docs/nice-to-have.md`: delete the `Per-source errors in the MCP list` section, and from `Frontend fix-wave loose ends` the lines for the linter (biome does it), the `Toaster` under a modal, `bun` in `src/tsconfig.json`, `0 plugins · 0 enabled`, the command-menu hint spacing, and `describeJsonError` if Task 4 found it stale.

- [ ] **Step 3: Flip the specs**

`tokens.md`, `settings.md`, `api/mcp.md`, `ui/mcp.md`, `editing.md`: `Stable · Partial` → `Stable · Built`; remove the *Planned* markers and the tokens note under At a glance, keeping every `Changes:` backlink. Delete this plan.

- [ ] **Step 4: Gates and commit**

Gates green; `grep -rn "Planned;" docs/spec` and `grep -rn "Partial" docs/spec/ui docs/spec/api` match nothing.

```
docs: show the page in the readme and close the entries this branch built
```

---

## Self-review

**Spec coverage:** `tokens.md` values and controls, `settings.md` badge → Task 1; `api/mcp.md` envelope, `ui/mcp.md` banner → Task 2; `ui/mcp.md` add dialog, `editing.md` delete dialog → Task 3; `shell.md` hint, plugins summary, page types → Task 4; README, deferred list, flips → Task 5.

**Placeholders:** Task 2 Steps 1 and 5 and Task 3 Step 1 name fixture values and navigation the implementer copies from neighbouring cases in the same file; everything else is literal.

**Type consistency:** `McpList` and `McpSourceError` in `shared/api.ts` (Task 2) are what `listMcp`, `McpScreen` and the e2e mock use.
