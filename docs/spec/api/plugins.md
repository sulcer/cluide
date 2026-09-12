# Plugins resource

Status: Draft · Planned · 2026-09-12 · Installed plugins, where they come from, and their enabled state.

## At a glance

Claude Code keeps a registry of installed plugins and a registry of the marketplaces they came
from, both under `~/.claude/plugins/`. Whether a plugin is enabled is a separate map in
`settings.json`. cluide joins the three into one list and lets the user flip the enabled flag.
Enabling and disabling never moves or deletes plugin files; it edits one key in `settings.json`.

## Files

| File | Shape, verified 2026-09-12 | Read or write |
|---|---|---|
| `~/.claude/plugins/installed_plugins.json` | `{ version, plugins: { "<name>@<marketplace>": [{ scope, installPath, version, installedAt, lastUpdated }] } }` | read |
| `~/.claude/plugins/known_marketplaces.json` | `{ "<marketplace>": { source: { source, repo }, installLocation, lastUpdated } }` | read |
| `~/.claude/settings.json` → `enabledPlugins` | `{ "<name>@<marketplace>": boolean }` | write, slice etag |
| `<installPath>/.mcp.json`, `<installPath>/hooks/hooks.json` | presence only | read |

## Endpoints

| Method and path | Body | Response |
|---|---|---|
| `GET /api/plugins` | | `Plugin[]`, sorted by `id` |
| `PUT /api/plugins` | `{ id, enabled, etag? }` | `{ etag, diff }` |

## Shapes

| `Plugin` field | Type | Meaning |
|---|---|---|
| `id` | string | `<name>@<marketplace>`, the key in both registries |
| `name` | string | The part before `@` |
| `marketplace` | string | The part after `@` |
| `marketplaceSource` | string or null | `repo` from the marketplace registry, `warpdotdev/claude-code-warp`; null when the marketplace is unknown |
| `version` | string | From the newest entry in the installed registry |
| `installPath` | string | Absolute path of the installed version |
| `enabled` | boolean | `enabledPlugins[id]`, `false` when the key is absent |
| `hasMcp` | boolean | `.mcp.json` exists at `installPath` |
| `hasHooks` | boolean | `hooks/hooks.json` exists at `installPath` |

The etag on `PUT` and in the list is the hash of the `enabledPlugins` slice, so a concurrent edit to
another settings key does not block a toggle, and two toggles racing each other do.

## Open questions

None.
