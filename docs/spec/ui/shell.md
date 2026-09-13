# Shell

Status: Stable · Built · 2026-09-12 · The sidebar, header, footer, scope switcher, command menu, offline banner and toasts that every screen sits in.

## At a glance

The shell is a 240px sidebar on the left and a column on the right made of an optional 36px
offline banner, a 40px header and the screen. The sidebar holds the scope switcher, three groups of
navigation items with `⌘n` hints, and a footer with the theme toggle, the version and a `⌘K`
button. It collapses to a 48px icon rail. The command menu floats over everything. Toasts sit bottom
right. Widths: the frame is designed at 1440×900 and must work at 1024×768 with no horizontal
scroll.

## Sidebar, expanded

240px, `--sidebar` background, 1px `--sidebar-border` on the right, `--sidebar-foreground` text.

- **Scope button.** Container padding 8px 8px 4px. Button 32px tall, full width, padding 0 8px,
  radius 6px, weight 500, hover `--sidebar-accent`. Left: `Globe` for global, `Folder` for a
  project, `FolderX` for a missing one, all muted. Middle: scope name, ellipsis. Right:
  `ChevronsUpDown` muted.
- **Navigation.** Padding 4px 8px, groups 12px apart. Group label 24px tall, 12px 500 muted:
  `Config`, `Extensions`, `MCP`. Items 28px tall, gap 8px, padding 0 8px, radius 4px, weight 500,
  icon and label `--muted-foreground`; active item `--sidebar-accent` background,
  `--sidebar-foreground` text and icon, inset 2px bar; hover `--sidebar-accent` only. A kbd hint
  `⌘1` to `⌘9` sits at the right in 11px muted at 70% opacity, numbered by the item's position
  among the items shown. `Keybindings` and `Plugins` are shown only in global scope.
- **Footer.** 40px, 1px top border, padding 0 12px, gap 4px: a 28×28 icon button toggling the theme
  (`Sun` in dark, `Moon` in light), the version in mono 11px muted, a spacer, and a 24px bordered
  button showing the `Command` icon and `K` that opens the command menu.

## Sidebar, icon rail

48px, padding 8px 0, items centred. A 32×32 scope icon button; a 24×1 divider with 8px margins; one
32×32 radius-6 button per navigation item, active one with `--sidebar-accent` and foreground icon;
the theme button at the bottom. Every rail button shows a Tooltip with its label and `⌘n` hint. The
header's `PanelLeft` button toggles between expanded and rail; the choice persists in
`localStorage`.

## Scope switcher

A Combobox (Popover plus Command) anchored under the scope button: top 42px, left 8px, width
300px, `--popover` background, 1px `--border`, radius 8px, `--shadow`.

- Search row 36px with a `Search` icon, an input with placeholder `Switch scope` that has focus on
  open, and an `Esc` kbd.
- List, max height 328px, padding 4px: one item per project from `GET /api/projects`, `Global`
  first. Items are at least 36px tall, padding 4px 8px, radius 4px: icon, then the name on one
  line and the path in mono 11px muted under it, ellipsis on both. The current scope has
  `--accent` background and a `Check` on the right. A project with `exists: false` is at 50%
  opacity with a `FolderX` icon and the word `missing` on the right. Typing filters by name or
  path; no match shows `No project matches` centred in 12px muted.
- Footer 32px, 11px muted: `<n> projects` on the left, `↑↓ move` and `↵ switch` on the right.

Picking a scope keeps the screen unless it is global-only, in which case the screen becomes
`settings`. Any dirty edit is dropped without asking; the diff sheet after the next save is the undo.

## Header

40px, 1px bottom border, padding 0 12px 0 8px, gap 8px. Left: the 28×28 `PanelLeft` button.
Then the breadcrumb in weight 500: scope name muted, `/` muted, screen name. For a hook script the
screen name reads `Hooks / <file>`. A spacer. Right: the screen's single primary button when it has
one, 28px, `Plus` icon and label: `New rule`, `New agent`, `New skill`, `New command`, `New script`,
`Add server`. Settings, memory, keybindings, hooks and plugins have none.

## Offline banner

Shown above the header when a request fails because the server is unreachable. 36px, `--muted`
background, 1px bottom border, 12px text: `CircleAlert` in `--destructive`, then
`cluide server is not running. Start it with` and `bun run start` in a mono chip on `--secondary`
with 1px 5px padding. Right: a 24px bordered `Retry` button that reloads the current screen's data.

## Command menu

`⌘K`, the footer button, or the `Command` action. Overlay `rgba(0,0,0,.4)`. Panel 560px wide,
top 96px, centred, `--popover`, 1px `--border`, radius 8px, `--shadow`.

- Input row 44px: `Search` icon, input at 14px with placeholder `Type a command or search` and focus
  on open, `Esc` kbd.
- List, max height 380px, padding 4px, groups in order. Group label 24px, 11px 500 muted. Items 32px,
  gap 10px, radius 4px: icon, label, hint in mono 11px muted 8px after the label, kbd on the right.
  The first item is preselected with `--accent`; `↑`/`↓` move, `↵` runs.
- Groups: **Go to**, one item per navigation item shown with its `⌘n` and the route as hint.
  **Switch scope**, the first five projects, or every match when the query is not empty, path as
  hint. **Open file**, the last four files opened, from `localStorage`, `History` icon, path as
  hint. **Actions**: `Toggle theme`, `Add server`. Changes:
  [`2026-09-13-keyboard-and-cursor-after-hands-on-testing.md`](../../adr/2026-09-13-keyboard-and-cursor-after-hands-on-testing.md)
- Matching is case-insensitive on label and hint; a group with no matches disappears; no matches at
  all shows `No results for “<query>”` centred, 12px muted.
- Footer 32px, 11px muted: `↑↓ move`, `↵ open`, and `<scope> scope` on the right.

## Toasts

Bottom right, 16px from the edges, one at a time, 6 seconds unless dismissed. Min width 280px, max
420px, padding 10px 12px, `--popover`, 1px `--border`, radius 8px, `--shadow`, 13px. Left icon:
`Check` in `--success`, or `CircleAlert` in `--destructive` for errors. Title in 500; an optional
description under it in mono 12px muted, ellipsis. An optional action after a `·`, rendered as a
24px ghost button in `--link`. A 24×24 `X` dismisses.

| Event | Title | Description | Action |
|---|---|---|---|
| Save succeeded | `Saved` | | `View diff`, opens the diff sheet |
| Save failed with 400 or 422 | `Save failed` | `422 · json must be an object` | |
| File created | `Created <name>` | the full path | |
| File deleted | `Deleted <name>` | `backup in ~/.cluide/backups` | |
| Reload after conflict | `Reloaded <file> from disk` | | |
| Plugin toggled | `Enabled <name>` or `Disabled <name>` | `~/.claude/settings.json → enabledPlugins` | |
| Approval toggled | `Approved <name>` or `Approval removed for <name>` | `<repo>/.claude/settings.local.json` | |
| Server added | `Added <name>` | the file written | |
| Server saved from the sheet | `Saved` | the server name | |

## Open questions

None.
