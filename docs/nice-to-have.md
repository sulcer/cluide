# Nice-to-have backlog

Items intentionally deferred from in-progress specs and plans. Each entry: what, why deferred,
trigger to revisit, reference. Add an item when deferring. Remove it when it lands.

---

## Structured settings editors

- **What:** Form-based editors for the `hooks`, `permissions`, `model` and `enabledPlugins` keys of
  `settings.json`, instead of the raw JSON editor with schema warnings.
- **Why deferred:** The JSON editor plus validation covers every key today. Forms are per-key work
  and the UI design is not in yet.
- **Trigger:** The UI design arrives, or editing hooks by hand in JSON proves error-prone.
- **Reference:** [`api/settings.md`](spec/api/settings.md), [`ui`](spec/ui/README.md).

---

## Health screen

- **What:** Run validation across every file cluide knows (settings schema, JSON parse, hooks
  pointing at scripts that exist, MCP commands that resolve) and show one issue list. Plus an edit
  history browser over `~/.cluide/backups` with diffs.
- **Why deferred:** Both are reads over data the v1 resources already produce. Nothing to design
  yet beyond a screen.
- **Trigger:** v1 ships.
- **Reference:** [`write-safety.md`](spec/foundation/write-safety.md) (backups), [`api/settings.md`](spec/api/settings.md) (validation).

---

## Auto-memory per project

- **What:** Show and edit `~/.claude/projects/<encoded path>/memory/` (Claude Code's automatic
  memory) as a `memory` kind under project scope. The encoding replaces `/` with `-`.
- **Why deferred:** One more directory for the files resource; not needed to prove the tool.
- **Trigger:** v1 ships.
- **Reference:** [`file-map.md`](spec/foundation/file-map.md).

---

## Code editor with syntax highlighting

- **What:** CodeMirror 6 in place of the `Textarea` for markdown, JSON and shell files.
- **Why deferred:** A dependency and a bundle-size step for something a monospace textarea does
  acceptably.
- **Trigger:** Editing a long hook script or `settings.json` in the textarea starts to hurt.
- **Reference:** [`ui`](spec/ui/README.md).

---

## Activity: sessions, tokens, cost

- **What:** A session list with token counts and estimated cost per day, project and model, read
  from `~/.claude/projects/**/*.jsonl`.
- **Why deferred:** 566 MB of JSONL on the reference machine. Doing it well means an incremental
  index with a cache, which is a design of its own and contradicts "no database" unless scoped
  carefully.
- **Trigger:** A real need for cost visibility, and a design for the index.
- **Reference:** none yet.

---

## Single-binary distribution

- **What:** `bun build --compile` producing one executable that serves `dist/` and the API, for
  people who do not want to clone the repo.
- **Why deferred:** `bunx cluide` covers everyone who has Bun; a binary needs `dist/` embedded at
  compile time and carries the Bun runtime, about 90 MB per platform.
- **Trigger:** A user without Bun, or a Homebrew request. Attaches to the publish job in
  [`ci`](spec/ci/README.md), one asset per platform on the same release.
- **Reference:** [`dev-and-build.md`](spec/foundation/dev-and-build.md), [`ci`](spec/ci/README.md).

---

## Close the `~/.claude.json` write window

- **What:** Re-read `~/.claude.json` immediately before the rename and re-apply the managed slice,
  or take a file lock, so a Claude Code write landing between cluide's read and rename is not lost.
- **Why deferred:** The window is milliseconds and the loss is limited to keys Claude Code
  rewrites on its own anyway. Slice etags already prevent cluide from clobbering a *user* edit.
- **Trigger:** An observed lost write, or Claude Code starting to store something in that file that
  it does not regenerate.
- **Reference:** [`write-safety.md`](spec/foundation/write-safety.md), known ceiling.

---

## Per-source errors in the MCP list

- **What:** When one source file does not parse (a plugin's `.mcp.json`, a repo's `.mcp.json`),
  return the other sources and mark the broken one with its parse error, instead of failing the
  whole list with `422`.
- **Why deferred:** The settings screen has a raw-text repair path; adding one for every MCP
  source is a shape change to `McpEntry` and a screen change, for a file state that is rare.
- **Trigger:** The first time a broken plugin file hides a user's own servers.
- **Reference:** [`api/mcp.md`](spec/api/mcp.md), `readJsonOrEmpty` in the write-safety spec.

---

## Tolerant scope guard for a broken `~/.claude.json`

- **What:** Let `assertScope`/`projectPaths` (`server/paths.ts`) do something other than throw `422`
  for every project scope when `~/.claude.json` does not parse, so a project-scope MCP list (and
  every other project-scope resource) is not the one case the per-source-errors work still fails.
- **Why deferred:** `assertAllowed` uses the same project list to decide which paths may be read or
  written; degrading it either still refuses every project scope (no improvement) or accepts any
  absolute path when the file is broken, which drops that check. Picking between them is its own
  decision, not a side effect of the MCP list.
- **Trigger:** A broken `~/.claude.json` hiding a user's MCP servers in project scope becomes a real
  complaint — today they can still see them in global scope, where the guard is not consulted.
- **Reference:** [`api/mcp.md`](spec/api/mcp.md), `assertScope`/`assertAllowed` in `server/paths.ts`.

---

## Frontend fix-wave loose ends

Found reconciling the built frontend against its specs; each too small for its own section above.

- Reserved browser chords (`⌘⇧T`, `⌘1`–`⌘9`) must be pressed by hand in Chrome once — Playwright's
  `page.keyboard.press` bypasses the browser's own shortcut layer.
- e2e per-test independence: seed a home per worker instead of sharing one across the whole run.
- A linter/formatter (`eslint-plugin-react-hooks`) and the partial `useEffect` dependency arrays it
  would flag.
- The `Toaster` is `aria-hidden` behind an open Radix dialog or sheet — portal it outside, or make
  it `aria-live` from outside.
- `bun` in `src/tsconfig.json`'s `types` lets a stray `Bun.*` call typecheck in browser code.
- The MCP sheet's width comes from an explicit `max-width` over the generated `w-3/4` — a comment
  in `sheet.tsx`, not a cleaner fix.
- `0 plugins · 0 enabled` shows for one frame while `PluginsScreen` is loading.
- The plugin toggle e2e case proves only the toggled row's own etag updates.
- The hooks screen's "Read from" separator is untested with exactly two source files.
- `flattenHooks` has no test for a plain-string (non-array) `matcher`.
- The scripts list under the hooks empty state has no render case.
- Command-menu hint spacing renders at 10px; `shell.md` says 8px.
- `describeJsonError` shows Chrome's raw `JSON.parse` message, which carries no line number in
  Chrome.
- The SchemaStore schema types `managedMcpServers` as an array; the backend reads it as a map.
- Untested: the `Schema unavailable` badge, a `409` on the settings path, and `Retry` after a
  failed write.
- `cluide:save` broadcasts to every mounted draft; today exactly one is ever mounted at a time
  (also noted as a comment in `src/lib/events.ts`).

---

## Plugin MCP servers declared in `plugin.json`

- **What:** Read MCP servers a plugin declares inside its `plugin.json` manifest, not only in a
  top-level `.mcp.json`, so the merged list and `hasMcp` cover both forms.
- **Why deferred:** No installed plugin on the reference machine uses the manifest form, so there
  is nothing to test against.
- **Trigger:** A plugin whose servers Claude Code loads but cluide does not list.
- **Reference:** [`api/mcp.md`](spec/api/mcp.md) sources table, [`api/plugins.md`](spec/api/plugins.md).

---

## Required checks and the release pull request

Once `main` requires the `check`, `e2e` and `docs` checks, the release pull request that
release-please opens with the Actions token has none, because GitHub does not start workflows for
events that token creates; merge it with the administrator override, or move release-please to a
GitHub App or fine-grained token that starts workflows.

- **Reference:** [`ci`](spec/ci/README.md), Go public.
