# Projects resource

Status: Stable · Planned · 2026-09-12 · The list of projects the scope switcher offers.

## At a glance

Claude Code records every directory it has been started in under `projects` in `~/.claude.json`.
That map is cluide's project list. Some of those directories no longer exist; the list says so
rather than hiding them, because their `~/.claude.json` entries still hold local MCP servers.

## Endpoint

| Method and path | Response |
|---|---|
| `GET /api/projects` | `Project[]`, sorted by `name` |

## Shape

| Field | Type | Meaning |
|---|---|---|
| `path` | string | Absolute path, the key in `~/.claude.json`. Used as the `scope` value everywhere else. |
| `name` | string | The last path segment. The home directory shows as `~`. |
| `exists` | boolean | The directory is present on disk. |

## Open questions

None.
