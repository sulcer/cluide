---
tags: api, mcp, ui, accessibility, tokens
status: accepted
decision-date: 2026-09-15
---

# Pre-release refinements

## Members

- @sulcer (deciding)
- Claude Code (facilitating)

## Status

accepted

## Context and Problem Statement

Before the repository goes public and `cluide` is published, the deferred list in
`nice-to-have.md` holds two behaviours a stranger's machine will hit. One unparsable MCP source
file (a plugin's `.mcp.json`, a project's `.mcp.json`, `~/.claude.json`) fails the whole
`GET /api/mcp` with `422`, so the screen shows nothing although every other source is fine. And a
toast raised while a dialog stays open after a failed action is invisible to assistive
technology: an open modal marks every other node `aria-hidden`, as the ARIA modal pattern
requires, so no placement of the toaster fixes it.

The page's palette was built without an accent hue: primary buttons, the switch's on state and
links are grays told apart by contrast, and every neutral sits on a faint blue at hue 264. Next to
the design it follows (Linear's, after its 2026 refresh: warm neutrals with almost no chroma, one
indigo accent, borders that are felt rather than seen), the gray switch reads as off, the gray
primary button reads as secondary, and the amber count badge is the loudest thing on the settings
screen although it announces three schema warnings.

## Options considered

For the tokens: keep the no-accent palette and adjust contrast only; or adopt one accent and
neutral warm grays measured from the reference, keeping the shadcn variable set so nothing but
`globals.css` and the token spec change.

For the MCP list:

1. **Keep `McpEntry[]` and fail the whole list**, as today. Nothing to change; a broken plugin
   hides the user's own servers.
2. **Keep `McpEntry[]` and carry the errors out of band** (a response header). Wire-compatible,
   invisible to the page's typed client, and unlike anything else in the API.
3. **An envelope: `{ entries, errors }`**, like `SettingsDoc.errors` already does for schema
   errors. The page changes one type and gains a banner; the shape is the one the API already
   uses for a read that partly succeeded.

For the toast under a modal: portal the toaster elsewhere (does not escape `aria-hidden`; the
package hides every body child that is not an ancestor of the dialog), or show the error inside
the dialog that stays open.

## Decision

Option 3 for the list: a source that exists but does not parse is skipped and listed in
`errors` as `{ file, message }`; the other sources are returned. Writes to that file still answer
`422`, since a file that cannot be parsed cannot be patched. The screen shows one destructive line
per broken file above the table and the parsed entries below it.

For the tokens: the second option. The neutrals move to hue 60 with chroma 0.002 at the reference's
lightness steps (`#131313` main, `#0d0d0e` sidebar, `#1e1e1f` popover, `#262728` secondary);
`--primary`, `--ring` and the switch's on track take the indigo `#5262c8`
(`oklch(0.537 0.158 273)`), links a lighter step of it, `--destructive` the reference red
`#ed474b`, `--warning` its orange instead of amber. Secondary buttons lose their border, the count
badge becomes a neutral number, and selected rows lose the inset bar: the background step is enough
once nothing else competes.

For dialogs: the delete dialog and the add-server dialog show a failed action's error inside the
dialog, under the body text, instead of raising a toast. Toasts stay for everything that happens
with no modal open. The Playwright helper that matched a toast under a modal goes away with the
behaviour.

## Consequences

- `GET /api/mcp` changes shape; `api/mcp.md`, `shared/api.ts`, `McpScreen` and the e2e mocks
  change together. The 422 row in `api/README.md` gains the exception.
- `readJsonOrEmpty` stays the write-side gate; the list uses `readJsonDoc` directly to tell
  "missing" from "broken".
- `editing.md` (delete dialog) and `ui/mcp.md` (add dialog, list) carry `Changes:` backlinks here.
- `tokens.md` carries the new values with a `Changes:` backlink; `settings.md` follows the badge.
  Every render in `e2e/renders/` changes; the render suite's colour assertions (the cursor case,
  any `toHaveCSS` on a token) are checked, not loosened.
- The rest of the batch (the plugins screen's loading flash, the command-menu hint spacing, `bun`
  types out of the page's tsconfig, the README) fixes drift against Stable specs and needs no
  decision.

## Out of scope

Per-worker homes for the Playwright suite. With one worker the run is already isolated; parallel
workers buy speed for the cost of one server per worker, deferred until the suite is slow enough
to matter.
