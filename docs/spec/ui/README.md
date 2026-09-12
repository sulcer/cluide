# UI

Status: Draft · Planned · 2026-09-12 · The page: routes, data flow and the save experience. Screens are defined when the UI design arrives.

## At a glance

The page is a React app built with Vite, styled with Tailwind and shadcn/ui. It has one layout: a
sidebar that picks the scope (global or a project) and the screen, and a content area. Every
screen loads its data from one [`api`](../api/README.md) resource when it mounts, keeps it in local
state, and saves with the etag it loaded. Nothing is cached across screens, on purpose: the files
are the truth and a screen always shows what is on disk right now.

This document carries only the parts that do not depend on the visual design: routes, data flow,
save behaviour. The screens section is written when the design is handed over.

## Routes

The scope lives in the URL so deep links and browser back and forward work. `<scope>` is `global`
or `p/<encodeURIComponent(project path)>`.

| Route | Screen | Resource |
|---|---|---|
| `/` | redirects to `/global/settings` | |
| `/<scope>/settings` | settings editor, shared and local file | settings |
| `/<scope>/memory` | `CLAUDE.md` and, for projects, `CLAUDE.local.md` | files, `memory` |
| `/<scope>/rules` | rules | files, `rules` |
| `/<scope>/agents` | agents | files, `agents` |
| `/<scope>/skills` | skills | files, `skills` |
| `/<scope>/commands` | commands | files, `commands` |
| `/<scope>/hooks` | hook events from settings, linking to scripts | settings + files, `hooks` |
| `/<scope>/mcp` | merged MCP server list | mcp |
| `/global/keybindings` | keybindings | files, `keybindings` |
| `/global/plugins` | plugins | plugins |

Switching scope keeps the screen and swaps the first segment.

## Data flow

- No global store. Each screen owns its data through a small `useResource(url)` hook that returns
  `{ data, etag, error, reload }` over `fetch`.
- `src/api/client.ts` adds `X-Cluide: 1` to every mutating call, unwraps the error shape from the
  [`api` conventions](../api/README.md), and throws a typed error the screen can switch on.
- Types are imported from `shared/api.ts` only, so a server change breaks the page at compile time.

## Save behaviour

This is the contract every editing screen honours, whatever it looks like.

| Situation | Behaviour |
|---|---|
| Content changed | The screen is dirty: a visible indicator, Save and Discard available, `beforeunload` warns on navigation. |
| Save | `PUT` with the etag from load. On success the new etag replaces the old, the screen is clean, and the returned diff is offered for viewing. |
| `409 conflict` | The screen shows that the file changed on disk and offers Reload (drop local edits, load current) or Overwrite (`PUT` without etag). Never silent. |
| `422` or `400` | The message from the server is shown next to the editor; the content stays editable. |
| Missing optional file | The screen shows Create instead of an editor; Create does a `POST`. |

## Hooks screen, one design-independent fact

What fires when lives in `settings.json` → `hooks`, not in the `hooks/` directory. The hooks
screen therefore reads the `hooks` key through the settings resource and renders events with their
matchers and commands. A command that points at a local script links to that file's editor. Editing
the mapping itself happens in the settings screen in v1.

## Open questions

- Screens: layout, component choices and editor presentation wait for the UI design.
