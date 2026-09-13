---
tags: frontend, spec
status: accepted
decision-date: 2026-09-13
---

# Frontend build reconciliations

## Members

- @sulcer (deciding)
- Claude Code (facilitating)

## Status

`accepted`

## Context and Problem Statement

Two gaps surfaced while reconciling the built frontend against its specs. First, the `ui` spec
defined what happens when the server is unreachable (the offline banner) but not what a mounted
screen shows when its one resource read comes back with a 4xx or 5xx status — an unknown scope, an
unparsable `.mcp.json`, a broken `installed_plugins.json` — which left every list and the settings
document stuck on permanent loading skeletons. Second, `settings.md` said the warnings panel moves
under the editor "below 1200px of frame width", but the built panel uses a CSS viewport media query,
and at the design's 1440px viewport (a 1200px content frame once the 240px sidebar is subtracted)
only the viewport reading reproduces the design's render.

## Options considered

**Failed list read**

- *Skeletons forever* (status quo). Rejected: a permanent loading state for what is really an
  error hides the problem and gives the user nothing to do about it.
- *A toast only.* Rejected: transient, and the screen underneath stays empty with no way to retry.
- *A centred state with `Retry`* (**chosen**).

**Warnings panel breakpoint**

- *Frame width*, matching the spec's original wording literally (a container query on the editor
  column's own width). Rejected: the design's frame width and the browser's viewport width diverge
  once real sidebar and scrollbar chrome are accounted for, so a literal frame-width query doesn't
  reproduce the design's render at its own stated viewport.
- *Viewport width* (**chosen**), matching what was actually built.

## Decision

A list read that fails with a status gets a visible state: a centred `<screen> could not be loaded`
with the status, the message and a `Retry` button that calls the resource's `reload()`, shared by
every list screen (files, hooks, MCP, plugins) and the settings document via one `LoadFailed`
component. A network failure is excluded — `client.ts` turns that into `cluide:offline` and the
shell's offline banner covers it instead, so the two states never show at once.

The warnings panel's breakpoint is the viewport width, via a `min-width` media query, not the
frame or container width. `settings.md` is reworded from "below 1200px of frame width" to "below a
1200px viewport" to match.

## Consequences

- Five screens (`FilesScreen`, `HooksScreen`, `McpScreen`, `PluginsScreen`, `SettingsScreen`) share
  one small component instead of five ad hoc error states, and any future list screen gets the
  state for free.
- The breakpoint no longer tracks a resize of the editor column alone (e.g. a narrower sheet next
  to it); it only reacts to the browser window. Revisiting to a container query is possible later
  without a spec change beyond this one.
