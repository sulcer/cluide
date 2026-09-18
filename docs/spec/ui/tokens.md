# Tokens

Status: Stable · Built · 2026-09-15 · The colours, type, spacing, radii, fonts and icons every screen is built from.

## At a glance

The theme is the shadcn/ui variable set in OKLCH, dark on `:root` and light under
`[data-theme="light"]`, plus six cluide additions for links, status colours, diff lines and the
floating-layer shadow. The neutrals are a warm gray with almost no chroma, and one accent, an
indigo, carries the primary button, the switch's on state, links and the focus ring. Selected rows
and the active navigation item are a background step, nothing more. Green, orange and red appear
only on status icons, warnings and diff lines. The values below are pasted into `globals.css`
unchanged; Tailwind reads them through `@theme inline`. Changes:
[`2026-09-15-pre-release-refinements.md`](../../adr/2026-09-15-pre-release-refinements.md).

## Theme variables

| Variable | Dark (`:root`, `[data-theme="dark"]`) | Light (`[data-theme="light"]`) |
|---|---|---|
| `--background` | `oklch(0.187 0.002 60)` | `oklch(0.995 0.001 60)` |
| `--foreground` | `oklch(0.925 0.002 60)` | `oklch(0.2 0.002 60)` |
| `--card` | `oklch(0.187 0.002 60)` | `oklch(0.995 0.001 60)` |
| `--card-foreground` | `oklch(0.925 0.002 60)` | `oklch(0.2 0.002 60)` |
| `--popover` | `oklch(0.235 0.002 60)` | `oklch(1 0 0)` |
| `--popover-foreground` | `oklch(0.925 0.002 60)` | `oklch(0.2 0.002 60)` |
| `--primary` | `oklch(0.537 0.158 273)` | `oklch(0.537 0.158 273)` |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` |
| `--secondary` | `oklch(0.272 0.002 60)` | `oklch(0.955 0.002 60)` |
| `--secondary-foreground` | `oklch(0.925 0.002 60)` | `oklch(0.2 0.002 60)` |
| `--muted` | `oklch(0.235 0.002 60)` | `oklch(0.96 0.002 60)` |
| `--muted-foreground` | `oklch(0.65 0.008 60)` | `oklch(0.5 0.008 60)` |
| `--accent` | `oklch(0.243 0.002 60)` | `oklch(0.94 0.002 60)` |
| `--accent-foreground` | `oklch(0.925 0.002 60)` | `oklch(0.2 0.002 60)` |
| `--destructive` | `oklch(0.637 0.202 24)` | `oklch(0.58 0.2 24)` |
| `--border` | `oklch(0.255 0.002 60)` | `oklch(0.9 0.002 60)` |
| `--input` | `oklch(0.31 0.002 60)` | `oklch(0.88 0.002 60)` |
| `--ring` | `oklch(0.537 0.158 273)` | `oklch(0.537 0.158 273)` |
| `--radius` | `6px` | `6px` |
| `--sidebar` | `oklch(0.16 0.002 60)` | `oklch(0.975 0.001 60)` |
| `--sidebar-foreground` | `oklch(0.925 0.002 60)` | `oklch(0.2 0.002 60)` |
| `--sidebar-primary` | `oklch(0.537 0.158 273)` | `oklch(0.537 0.158 273)` |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-accent` | `oklch(0.243 0.002 60)` | `oklch(0.93 0.002 60)` |
| `--sidebar-accent-foreground` | `oklch(0.925 0.002 60)` | `oklch(0.2 0.002 60)` |
| `--sidebar-border` | `oklch(0.215 0.002 60)` | `oklch(0.9 0.002 60)` |
| `--sidebar-ring` | `oklch(0.537 0.158 273)` | `oklch(0.537 0.158 273)` |
| `--link` | `oklch(0.62 0.148 276)` | `oklch(0.48 0.16 273)` |
| `--success` | `oklch(0.72 0.14 150)` | `oklch(0.55 0.15 150)` |
| `--warning` | `oklch(0.72 0.17 55)` | `oklch(0.66 0.17 55)` |
| `--diff-add` | `oklch(0.72 0.14 150 / 0.12)` | `oklch(0.55 0.15 150 / 0.12)` |
| `--diff-del` | `oklch(0.637 0.202 24 / 0.12)` | `oklch(0.58 0.2 24 / 0.12)` |
| `--shadow` | `0 8px 24px oklch(0 0 0 / 0.45), 0 0 0 1px oklch(0 0 0 / 0.3)` | `0 8px 24px oklch(0 0 0 / 0.12), 0 0 0 1px oklch(0 0 0 / 0.06)` |

Dark is the default. The theme is stamped as `data-theme` on the root element from `localStorage`,
falling back to dark; the toggle in the sidebar footer flips it.

## Type

Inter for UI, JetBrains Mono for code, paths, JSON, commands, badges and kbd hints. Both are bundled
through fontsource so the app looks the same offline; system fallbacks are
`system-ui, -apple-system, sans-serif` and `ui-monospace, Menlo, monospace`.

| Use | Size / line height | Weight |
|---|---|---|
| Body, table cells, nav items, buttons | 13px / 20px | 400, labels and buttons 500 |
| Secondary text, table headers, mono cells, tabs, kbd labels in text | 12px / 18px | 400, headers 500 |
| Editor textarea | 12.5px / 20px mono, `tab-size: 2` | 400 |
| Small labels, kbd, badges, footers, paths under names | 11px / 16px, 14px in the scope switcher | 400, badges 500 |
| Dialog titles, command menu input | 14px / 20px | 600 for titles |
| Segmented control sub-labels | 10px / 14px mono | 400 |

## Spacing, radii, shadows

- Spacing is on a 4px base: 4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 48.
- Radii: 4px for list items, small controls and kbd; 6px (`--radius`) for buttons, inputs and the
  scope button; 8px for popovers, dialogs, sheets and toasts; 9px for switches.
- Borders are 1px `--border` (`--sidebar-border` inside the sidebar, `--input` on inputs).
- Shadows only on floating layers: `--shadow` on the scope popover, command menu, sheet, dialogs and
  toasts. Segmented-control selections carry `0 1px 2px rgba(0,0,0,.2)`.
- Overlays: command menu `rgba(0,0,0,.4)`, sheets `.3`, dialogs `.45`.
- Focus: `2px solid var(--ring)` outline, offset `-1px` on inputs and textareas, `1px` on buttons,
  only for `:focus-visible` on buttons.

## Controls

| Control | Size and shape |
|---|---|
| Button, primary | 28px tall (32px in dialogs), padding 0 10px (12px in dialogs), radius 6px, `--primary` on `--primary-foreground`, weight 500, icon gap 6px |
| Button, secondary | same, `--secondary` fill and no border, hover one step lighter (`--accent` in light, `oklch(0.3 0.002 60)` in dark) |
| Button, ghost | same, transparent, hover `--accent` |
| Button, destructive | `--destructive` on white in dialogs; ghost with `--destructive` text in sheet footers |
| Icon button | 28×28, radius 4px, `--muted-foreground`, hover `--accent` and `--foreground` |
| Input | 28px in toolbars, 32px in dialogs; padding 0 8px or 10px; 1px `--input`; radius 4px in toolbars, 6px in dialogs |
| Switch | 32×18, radius 9px, 14px white thumb with `0 1px 2px rgba(0,0,0,.3)`, track `--primary` on and `--input` off, 150ms transitions |
| Kbd | 11px, padding 0 4px, radius 4px, `--muted` with 1px `--border`; inside a primary button `rgba(255,255,255,.16)` and no border |
| Badge, scope | 18px, padding 0 6px, radius 4px, mono 11px 500. `local`: `--background` text on a `--foreground` chip. `project`: 1px solid `--foreground`. `user`: `--secondary` with 1px `--border`. `plugin`: 1px dashed `--muted-foreground`, muted text. `managed`: `--muted` with 1px `--border`, muted text. |
| Badge, provides | 18px, padding 0 6px, radius 4px, `--secondary` with 1px `--border`, 11px 500 |
| Badge, count | 18px round, min-width 18px, `--secondary` with `--foreground` text when the count is above zero, `--muted` with muted text at zero; the count is a number, not an alarm |
| Badge, dashed note | 18px, padding 0 6px, radius 4px, 1px dashed `--border`, muted 11px, icon gap 4px |
| Selected row or item | `--accent` background (`--sidebar-accent` in the sidebar), text in `--foreground`; no inset bar |
| Hovered row or item | background only, `--accent` or `--sidebar-accent`; text stays as it was |
| Dimmed row | opacity 0.5 (shadowed MCP entries), 0.55 (disabled plugins), 0.6 (disabled Save, read-only textarea) |
| Cursor | `pointer` on every enabled button, link, option, switch and `label[for]`; Tailwind v4's preflight leaves buttons at `default`, so one base rule in `globals.css` sets it. Changes: [`2026-09-13-keyboard-and-cursor-after-hands-on-testing.md`](../../adr/2026-09-13-keyboard-and-cursor-after-hands-on-testing.md) |

## Icons

lucide, 16px, stroke 1.5, `currentColor`. The fixed mapping:

| Use | Icon |
|---|---|
| Settings, Memory, Rules, Keybindings | `Settings`, `Brain`, `ListChecks`, `Keyboard` |
| Agents, Skills, Commands, Hooks, Plugins | `Bot`, `Sparkles`, `SquareTerminal`, `Webhook`, `Puzzle` |
| MCP servers | `Server` |
| Global scope, project, missing project | `Globe`, `Folder`, `FolderX` |
| Files: text, script, skill folder | `FileText`, `FileCode`, `Folder` |
| Scope switcher trigger, search, check, close | `ChevronsUpDown`, `Search`, `Check`, `X` |
| Read-only, add, delete, sidebar toggle | `Lock`, `Plus`, `Trash2`, `PanelLeft` |
| Theme | `Sun` in dark, `Moon` in light |
| Warning, error, loading, shadowed, link out, recent, command | `TriangleAlert`, `CircleAlert`, `LoaderCircle` (spinning), `CornerDownRight`, `ArrowRight`, `History`, `Command` |

## Open questions

None.
