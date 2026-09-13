# Plugins screen

Status: Stable · Built · 2026-09-12 · Installed plugins and their enable switch.

## At a glance

Global scope only. One table from `GET /api/plugins`, one row per installed plugin, with a filter
input above it and a switch on the right that writes `enabledPlugins` immediately. Disabled plugins
are dimmed. Badges say whether a plugin brings MCP servers or hooks.

## Toolbar

44px, padding 0 16px, gap 12px, 1px bottom border: a 260×28 input with a `Search` icon and
placeholder `Filter plugins`, filtering by name or marketplace, case-insensitive; then the count in
12px muted: `<n> plugins · <m> enabled`, counted over all plugins, not the filtered ones.

## Table

13px. Header cells 32px, 12px 500 muted, 1px bottom border. Rows 44px, 1px bottom border, hover
`--accent`. A disabled plugin's row is at 55% opacity.

| Column | Width | Content |
|---|---|---|
| Plugin | auto, padding 0 16px | The name in 500 on the first line, the marketplace in 11px muted on the second |
| Source | 300px | `marketplaceSource` in mono 12px muted, empty when null |
| Version | 90px | `version` in mono 12px |
| Provides | 140px | Provides badges, 4px apart: `MCP` when `hasMcp`, `Hooks` when `hasHooks`; none otherwise |
| Enabled | 96px, padding 0 16px 0 12px | The switch |

Rows are sorted by id, as the server returns them.

## The switch

Flipping it calls `PUT /api/plugins` with the id, the new value and the etag from the last read,
updates the row and the count, and toasts `Enabled <name>` or `Disabled <name>` with
`~/.claude/settings.json → enabledPlugins`. A `409` reloads the list and toasts `Save failed` with the
message. Flipping a plugin that provides MCP servers also changes what the MCP screen lists; the MCP
screen reads fresh on mount, so nothing else needs to happen.

## Open questions

None.
