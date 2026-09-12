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
- **Why deferred:** The only user is the author until v1 works.
- **Trigger:** Sharing the tool with someone else.
- **Reference:** [`dev-and-build.md`](spec/foundation/dev-and-build.md).

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
