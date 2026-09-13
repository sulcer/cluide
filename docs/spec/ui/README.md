# UI

Status: Stable · Built · 2026-09-12 · The page: one shell, nine screens, and the save experience every editing screen shares.

## At a glance

The page is a React app built with Vite, styled with Tailwind v4 and shadcn/ui, using the tokens in
[`tokens.md`](./tokens.md). It has one layout: a 240px sidebar that picks the scope and the screen,
a 40px header with a breadcrumb and the screen's one primary action, and a content area. Every
screen loads its data from one [`api`](../api/README.md) resource when it mounts, keeps it in local
state, and saves with the etag it loaded. Nothing is cached across screens, on purpose: the files are
the truth and a screen always shows what is on disk right now. The look is dense and typographic:
13px text, 28px to 36px rows, 1px borders, a neutral palette where state is carried by weight and
contrast, dark by default and equally finished in light.

## Routes

The scope lives in the URL so deep links and browser back and forward work. `<scope>` is `global`
or `p/<encodeURIComponent(project path)>`.

| Route | Screen | Resource | Spec |
|---|---|---|---|
| `/` | redirects to `/global/settings` | | |
| `/<scope>/settings` | settings editor, shared and local file | settings | [`settings.md`](./settings.md) |
| `/<scope>/memory` | `CLAUDE.md`, and for projects `CLAUDE.local.md` | files `memory` | [`editing.md`](./editing.md) |
| `/<scope>/rules` | rules | files `rules` | [`editing.md`](./editing.md) |
| `/<scope>/agents` | agents | files `agents` | [`editing.md`](./editing.md) |
| `/<scope>/skills` | skills | files `skills` | [`editing.md`](./editing.md) |
| `/<scope>/commands` | commands | files `commands` | [`editing.md`](./editing.md) |
| `/<scope>/hooks` | hook events from settings, with the script list | settings, files `hooks` | [`hooks.md`](./hooks.md) |
| `/<scope>/hooks/<file>` | one hook script in the editor | files `hooks` | [`editing.md`](./editing.md) |
| `/<scope>/mcp` | merged MCP server list | mcp | [`mcp.md`](./mcp.md) |
| `/global/keybindings` | keybindings | files `keybindings` | [`editing.md`](./editing.md) |
| `/global/plugins` | plugins | plugins | [`plugins.md`](./plugins.md) |

Switching scope keeps the screen. A global-only screen (keybindings, plugins) falls back to
`settings` when the scope becomes a project.

## Keyboard

The shell container has `tabIndex=-1` and takes focus on any click inside it, so shortcuts work
without hunting for a focusable element.

| Keys | Does |
|---|---|
| `⌘K` | Toggle the command menu |
| `⌘S` | Save when the editor or an open sheet is dirty; ignored otherwise |
| `Esc` | Close the command menu, dialog, sheet, scope switcher or new-file input; with none open, discard edits |
| `⌘1` to `⌘9` | Go to the nth item of the sidebar as currently shown; the numbers shift when global-only items hide |
| `j` / `k` | Move the selection in a file list when focus is not in an input |
| `⌘⇧T` | Toggle theme, from the command menu |

`⌘` is `Ctrl` outside macOS.

## Data flow

- No global store. Each screen owns its data through a small `useResource(url)` hook that returns
  `{ data, error, loading, reload }` over `fetch`; every resource carries its etag inside `data`.
  Cross-cutting signals (save, escape, the header's primary action, offline, retry) are window
  events, not a store.
- `src/api/client.ts` adds `X-Cluide: 1` to every mutating call, unwraps the error shape from the
  [`api` conventions](../api/README.md), and throws a typed error the screen can switch on.
- Types are imported from `shared/api.ts` only, so a server change breaks the page at compile time.
- Theme, sidebar collapse and the command menu's recent files are per-viewer conveniences kept in
  `localStorage`, read inside `try`, and default sanely when missing.
- The app version shown in the sidebar footer is `package.json`'s `version`, inlined at build time.

## Topic files

| File | What it covers |
|---|---|
| [`tokens.md`](./tokens.md) | Both themes as shadcn CSS variables, type scale, spacing, radii, fonts, icons, badge treatments. |
| [`shell.md`](./shell.md) | Sidebar expanded and as icon rail, scope switcher, header, footer, offline banner, command menu, toasts. |
| [`editing.md`](./editing.md) | The file editor used by seven kinds: list, filter, new file, save bar, states, diff sheet, conflict and delete dialogs. With the save-state SVG. |
| [`settings.md`](./settings.md) | Tabs, JSON editor, warnings panel, unparsable and missing states. |
| [`hooks.md`](./hooks.md) | The event table read from settings and the script list. |
| [`mcp.md`](./mcp.md) | The server table, the server sheet, the add dialog, approval. |
| [`plugins.md`](./plugins.md) | The plugin table and the enable switch. |

## Open questions

None.
