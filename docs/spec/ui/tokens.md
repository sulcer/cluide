# Tokens

Status: Stable · Built · 2026-09-12 · The colours, type, spacing, radii, fonts and icons every screen is built from.

## At a glance

The theme is the shadcn/ui variable set in OKLCH, dark on `:root` and light under
`[data-theme="light"]`, plus six cluide additions for links, status colours, diff lines and the
floating-layer shadow. There is no accent hue: primary buttons, the active navigation item and
selected rows are distinguished by contrast and a 2px inset bar, not by colour. Green, amber and red
appear only on badges, warnings and diff lines. The values below are pasted into `globals.css`
unchanged; Tailwind reads them through `@theme inline`.

## Theme variables

| Variable | Dark (`:root`, `[data-theme="dark"]`) | Light (`[data-theme="light"]`) |
|---|---|---|
| `--background` | `oklch(0.175 0.004 264)` | `oklch(0.995 0.001 264)` |
| `--foreground` | `oklch(0.92 0.004 264)` | `oklch(0.2 0.005 264)` |
| `--card` | `oklch(0.175 0.004 264)` | `oklch(0.995 0.001 264)` |
| `--card-foreground` | `oklch(0.92 0.004 264)` | `oklch(0.2 0.005 264)` |
| `--popover` | `oklch(0.215 0.005 264)` | `oklch(1 0 0)` |
| `--popover-foreground` | `oklch(0.92 0.004 264)` | `oklch(0.2 0.005 264)` |
| `--primary` | `oklch(0.55 0.02 264)` | `oklch(0.55 0.02 264)` |
| `--primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` |
| `--secondary` | `oklch(0.235 0.005 264)` | `oklch(0.955 0.003 264)` |
| `--secondary-foreground` | `oklch(0.92 0.004 264)` | `oklch(0.2 0.005 264)` |
| `--muted` | `oklch(0.22 0.005 264)` | `oklch(0.96 0.003 264)` |
| `--muted-foreground` | `oklch(0.66 0.01 264)` | `oklch(0.5 0.01 264)` |
| `--accent` | `oklch(0.245 0.006 264)` | `oklch(0.94 0.004 264)` |
| `--accent-foreground` | `oklch(0.92 0.004 264)` | `oklch(0.2 0.005 264)` |
| `--destructive` | `oklch(0.63 0.19 25)` | `oklch(0.58 0.2 25)` |
| `--border` | `oklch(0.26 0.005 264)` | `oklch(0.9 0.004 264)` |
| `--input` | `oklch(0.29 0.005 264)` | `oklch(0.88 0.004 264)` |
| `--ring` | `oklch(0.62 0.03 264)` | `oklch(0.55 0.02 264)` |
| `--radius` | `6px` | `6px` |
| `--sidebar` | `oklch(0.155 0.004 264)` | `oklch(0.975 0.002 264)` |
| `--sidebar-foreground` | `oklch(0.92 0.004 264)` | `oklch(0.2 0.005 264)` |
| `--sidebar-primary` | `oklch(0.55 0.02 264)` | `oklch(0.55 0.02 264)` |
| `--sidebar-primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` |
| `--sidebar-accent` | `oklch(0.225 0.005 264)` | `oklch(0.93 0.004 264)` |
| `--sidebar-accent-foreground` | `oklch(0.92 0.004 264)` | `oklch(0.2 0.005 264)` |
| `--sidebar-border` | `oklch(0.235 0.005 264)` | `oklch(0.9 0.004 264)` |
| `--sidebar-ring` | `oklch(0.62 0.03 264)` | `oklch(0.55 0.02 264)` |
| `--link` | `oklch(0.78 0.03 264)` | `oklch(0.45 0.03 264)` |
| `--success` | `oklch(0.72 0.14 150)` | `oklch(0.55 0.15 150)` |
| `--warning` | `oklch(0.78 0.14 80)` | `oklch(0.65 0.15 80)` |
| `--diff-add` | `oklch(0.72 0.14 150 / 0.12)` | `oklch(0.55 0.15 150 / 0.12)` |
| `--diff-del` | `oklch(0.63 0.19 25 / 0.12)` | `oklch(0.58 0.2 25 / 0.12)` |
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
| Button, secondary | same, `--secondary` with 1px `--border`, hover `--accent` |
| Button, ghost | same, transparent, hover `--accent` |
| Button, destructive | `--destructive` on white in dialogs; ghost with `--destructive` text in sheet footers |
| Icon button | 28×28, radius 4px, `--muted-foreground`, hover `--accent` and `--foreground` |
| Input | 28px in toolbars, 32px in dialogs; padding 0 8px or 10px; 1px `--input`; radius 4px in toolbars, 6px in dialogs |
| Switch | 32×18, radius 9px, 14px white thumb with `0 1px 2px rgba(0,0,0,.3)`, track `--primary` on and `--input` off, 150ms transitions |
| Kbd | 11px, padding 0 4px, radius 4px, `--muted` with 1px `--border`; inside a primary button `rgba(255,255,255,.16)` and no border |
| Badge, scope | 18px, padding 0 6px, radius 4px, mono 11px 500. `local`: `--background` text on a `--foreground` chip. `project`: 1px solid `--foreground`. `user`: `--secondary` with 1px `--border`. `plugin`: 1px dashed `--muted-foreground`, muted text. `managed`: `--muted` with 1px `--border`, muted text. |
| Badge, provides | 18px, padding 0 6px, radius 4px, `--secondary` with 1px `--border`, 11px 500 |
| Badge, count | 18px round, min-width 18px, `--warning` with dark text when the count is above zero, `--muted` with muted text at zero |
| Badge, dashed note | 18px, padding 0 6px, radius 4px, 1px dashed `--border`, muted 11px, icon gap 4px |
| Selected row or item | `--accent` background (`--sidebar-accent` in the sidebar) plus `box-shadow: inset 2px 0 0 var(--foreground)` |
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
